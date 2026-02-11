package services

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

func TestValidateDiagnosePlanRequiresRetestSafetyNote(t *testing.T) {
	plan := DiagnosePlan{
		Diagnosis:  "Likely sanitizer imbalance.",
		Confidence: "Medium",
		Steps:      []string{"Brush walls", "Run filter"},
		ChemicalAdditions: []map[string]string{{
			"chemical":     "liquid_chlorine_10pct",
			"amount":       "64",
			"unit":         "oz",
			"instructions": "Add half dose now.",
		}},
		SafetyNotes:   []string{"Wear gloves."},
		RetestInHours: 4,
		WhenToCallPro: []string{"If filter pressure spikes."},
	}

	if err := ValidateDiagnosePlan(plan); err == nil {
		t.Fatalf("expected validation error for missing retest note")
	}
}

func TestGenerateDiagnosePlanSuccess(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/chat/completions" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		if !strings.HasPrefix(r.Header.Get("Authorization"), "Bearer ") {
			t.Fatalf("missing bearer auth header")
		}

		var reqBody map[string]any
		if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
			t.Fatalf("failed to decode request body: %v", err)
		}

		_ = json.NewEncoder(w).Encode(map[string]any{
			"choices": []map[string]any{
				{
					"message": map[string]any{
						"content": `{"diagnosis":"Likely low sanitizer and filtration issue.","confidence":"Medium","steps":["Clean filter","Add chlorine conservatively"],"chemical_additions":[{"chemical":"liquid_chlorine_10pct","amount":"64","unit":"oz","instructions":"Add half now and retest before additional dosing."}],"safety_notes":["Wear PPE","Retest before additional chemical additions."],"retest_in_hours":4,"when_to_call_pro":["If cloudiness persists beyond 24 hours"]}`,
					},
				},
			},
		})
	}))
	defer server.Close()

	t.Setenv("OPENAI_API_KEY", "test-key")
	t.Setenv("OPENAI_BASE_URL", server.URL)
	t.Setenv("OPENAI_MODEL", "gpt-4o-mini")

	plan, err := GenerateDiagnosePlan("Cloudy water and chlorine smell")
	if err != nil {
		t.Fatalf("expected success, got error: %v", err)
	}
	if plan.Confidence != "Medium" {
		t.Fatalf("expected Medium confidence, got %s", plan.Confidence)
	}
	if plan.RetestInHours != 4 {
		t.Fatalf("expected retest_in_hours 4, got %d", plan.RetestInHours)
	}
}

func TestGenerateDiagnosePlanInvalidModelOutput(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"choices": []map[string]any{
				{
					"message": map[string]any{
						"content": `{"diagnosis":"Likely issue.","confidence":"MEDIUM","steps":["Step one"],"chemical_additions":[],"safety_notes":["Wear gloves"],"retest_in_hours":4,"when_to_call_pro":["If no improvement"]}`,
					},
				},
			},
		})
	}))
	defer server.Close()

	t.Setenv("OPENAI_API_KEY", "test-key")
	t.Setenv("OPENAI_BASE_URL", server.URL)

	_, err := GenerateDiagnosePlan("Cloudy water")
	if err == nil {
		t.Fatalf("expected validation error")
	}
	if !strings.Contains(err.Error(), "confidence must be one of High, Medium, Low") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestGenerateDiagnosePlanMissingKey(t *testing.T) {
	_ = os.Unsetenv("OPENAI_API_KEY")
	_, err := GenerateDiagnosePlan("Cloudy water")
	if err == nil {
		t.Fatalf("expected error for missing key")
	}
}
