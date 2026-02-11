package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type DiagnosePlan struct {
	Diagnosis         string              `json:"diagnosis"`
	Confidence        string              `json:"confidence"`
	Steps             []string            `json:"steps"`
	ChemicalAdditions []map[string]string `json:"chemical_additions"`
	SafetyNotes       []string            `json:"safety_notes"`
	RetestInHours     int                 `json:"retest_in_hours"`
	WhenToCallPro     []string            `json:"when_to_call_pro"`
}

type openAIChatCompletionRequest struct {
	Model          string               `json:"model"`
	Temperature    float64              `json:"temperature"`
	ResponseFormat openAIResponseFormat `json:"response_format"`
	Messages       []openAIChatMessage  `json:"messages"`
}

type openAIResponseFormat struct {
	Type       string                `json:"type"`
	JSONSchema openAIJSONSchemaBlock `json:"json_schema"`
}

type openAIJSONSchemaBlock struct {
	Name   string         `json:"name"`
	Strict bool           `json:"strict"`
	Schema map[string]any `json:"schema"`
}

type openAIChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIChatCompletionResponse struct {
	Choices []struct {
		Message openAIChatMessage `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

const diagnoseSystemPrompt = `You are PoolPro, a conservative pool chemistry assistant.
Return ONLY JSON with fields: diagnosis, confidence, steps, chemical_additions, safety_notes, retest_in_hours, when_to_call_pro.
If required inputs are missing, set confidence to Low and ask for missing inputs before exact quantities.
Never provide aggressive dosing. Prefer add half, circulate, retest.
Always include safety notes and when to call a pro.`

func BuildFallbackPlan(symptoms string) DiagnosePlan {
	c := "Medium"
	if symptoms == "" {
		c = "Low"
	}
	return DiagnosePlan{
		Diagnosis:         "Likely sanitizer imbalance or filtration issue.",
		Confidence:        c,
		Steps:             []string{"Check and clean filter", "Raise free chlorine conservatively", "Brush pool walls and circulate"},
		ChemicalAdditions: []map[string]string{{"chemical": "liquid_chlorine_10pct", "amount": "64", "unit": "oz", "instructions": "Add half now, retest in 4 hours."}},
		SafetyNotes:       []string{"Never mix chemicals directly.", "Wear gloves and eye protection.", "Always retest before additional chemical additions."},
		RetestInHours:     4,
		WhenToCallPro:     []string{"If strong chlorine odor persists with high CC", "If water remains cloudy after 24-48h", "If pump/filter has abnormal pressure or electrical issues"},
	}
}

func HasOpenAIKey() bool { return os.Getenv("OPENAI_API_KEY") != "" }

func GenerateDiagnosePlan(symptoms string) (DiagnosePlan, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return DiagnosePlan{}, fmt.Errorf("OPENAI_API_KEY missing")
	}

	model := os.Getenv("OPENAI_MODEL")
	if model == "" {
		model = "gpt-4o-mini"
	}

	baseURL := os.Getenv("OPENAI_BASE_URL")
	if baseURL == "" {
		baseURL = "https://api.openai.com/v1"
	}

	userPrompt := fmt.Sprintf("Symptoms: %s\nGenerate a conservative plan for the next 24 hours.", strings.TrimSpace(symptoms))

	payload := openAIChatCompletionRequest{
		Model:       model,
		Temperature: 0.2,
		ResponseFormat: openAIResponseFormat{
			Type: "json_schema",
			JSONSchema: openAIJSONSchemaBlock{
				Name:   "poolpro_diagnose_plan",
				Strict: true,
				Schema: diagnosePlanJSONSchema(),
			},
		},
		Messages: []openAIChatMessage{
			{Role: "system", Content: diagnoseSystemPrompt},
			{Role: "user", Content: userPrompt},
		},
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return DiagnosePlan{}, fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, strings.TrimRight(baseURL, "/")+"/chat/completions", bytes.NewReader(bodyBytes))
	if err != nil {
		return DiagnosePlan{}, fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 20 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return DiagnosePlan{}, fmt.Errorf("openai request failed: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(io.LimitReader(resp.Body, 2<<20))
	if err != nil {
		return DiagnosePlan{}, fmt.Errorf("read openai response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return DiagnosePlan{}, fmt.Errorf("openai status %d: %s", resp.StatusCode, strings.TrimSpace(string(respBytes)))
	}

	var completion openAIChatCompletionResponse
	if err := json.Unmarshal(respBytes, &completion); err != nil {
		return DiagnosePlan{}, fmt.Errorf("decode openai response: %w", err)
	}
	if len(completion.Choices) == 0 {
		return DiagnosePlan{}, fmt.Errorf("openai returned no choices")
	}

	content := strings.TrimSpace(completion.Choices[0].Message.Content)
	if content == "" {
		return DiagnosePlan{}, fmt.Errorf("openai returned empty content")
	}

	jsonContent, err := extractJSONObject(content)
	if err != nil {
		return DiagnosePlan{}, err
	}

	var plan DiagnosePlan
	if err := json.Unmarshal([]byte(jsonContent), &plan); err != nil {
		return DiagnosePlan{}, fmt.Errorf("decode plan json: %w", err)
	}
	if err := ValidateDiagnosePlan(plan); err != nil {
		return DiagnosePlan{}, err
	}

	return plan, nil
}

func ValidateDiagnosePlan(plan DiagnosePlan) error {
	plan.Diagnosis = strings.TrimSpace(plan.Diagnosis)
	if plan.Diagnosis == "" {
		return fmt.Errorf("diagnosis is required")
	}
	if plan.Confidence != "High" && plan.Confidence != "Medium" && plan.Confidence != "Low" {
		return fmt.Errorf("confidence must be one of High, Medium, Low")
	}
	if len(plan.Steps) == 0 {
		return fmt.Errorf("steps must include at least one item")
	}
	for _, step := range plan.Steps {
		if strings.TrimSpace(step) == "" {
			return fmt.Errorf("steps cannot contain empty values")
		}
	}
	for _, addition := range plan.ChemicalAdditions {
		if strings.TrimSpace(addition["chemical"]) == "" || strings.TrimSpace(addition["amount"]) == "" ||
			strings.TrimSpace(addition["unit"]) == "" || strings.TrimSpace(addition["instructions"]) == "" {
			return fmt.Errorf("chemical additions must include chemical, amount, unit, and instructions")
		}
	}
	if len(plan.SafetyNotes) == 0 {
		return fmt.Errorf("safety notes must include at least one item")
	}
	hasRetestNote := false
	for _, note := range plan.SafetyNotes {
		trimmed := strings.TrimSpace(note)
		if trimmed == "" {
			return fmt.Errorf("safety notes cannot contain empty values")
		}
		if strings.Contains(strings.ToLower(trimmed), "retest") {
			hasRetestNote = true
		}
	}
	if !hasRetestNote {
		return fmt.Errorf("safety notes must include retest guidance")
	}
	if plan.RetestInHours < 1 || plan.RetestInHours > 48 {
		return fmt.Errorf("retest_in_hours must be between 1 and 48")
	}
	if len(plan.WhenToCallPro) == 0 {
		return fmt.Errorf("when_to_call_pro must include at least one item")
	}
	for _, item := range plan.WhenToCallPro {
		if strings.TrimSpace(item) == "" {
			return fmt.Errorf("when_to_call_pro cannot contain empty values")
		}
	}

	return nil
}

func extractJSONObject(s string) (string, error) {
	start := strings.IndexByte(s, '{')
	end := strings.LastIndexByte(s, '}')
	if start == -1 || end == -1 || end <= start {
		return "", fmt.Errorf("model did not return a JSON object")
	}
	return s[start : end+1], nil
}

func diagnosePlanJSONSchema() map[string]any {
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"diagnosis":  map[string]any{"type": "string"},
			"confidence": map[string]any{"type": "string", "enum": []string{"High", "Medium", "Low"}},
			"steps": map[string]any{
				"type":     "array",
				"items":    map[string]any{"type": "string"},
				"minItems": 1,
			},
			"chemical_additions": map[string]any{
				"type": "array",
				"items": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"chemical":     map[string]any{"type": "string"},
						"amount":       map[string]any{"type": "string"},
						"unit":         map[string]any{"type": "string"},
						"instructions": map[string]any{"type": "string"},
					},
					"required":             []string{"chemical", "amount", "unit", "instructions"},
					"additionalProperties": false,
				},
			},
			"safety_notes": map[string]any{
				"type":     "array",
				"items":    map[string]any{"type": "string"},
				"minItems": 1,
			},
			"retest_in_hours": map[string]any{"type": "integer", "minimum": 1, "maximum": 48},
			"when_to_call_pro": map[string]any{
				"type":     "array",
				"items":    map[string]any{"type": "string"},
				"minItems": 1,
			},
		},
		"required":             []string{"diagnosis", "confidence", "steps", "chemical_additions", "safety_notes", "retest_in_hours", "when_to_call_pro"},
		"additionalProperties": false,
	}
}
