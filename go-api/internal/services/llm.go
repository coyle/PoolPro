package services

import "os"

type DiagnosePlan struct {
	Diagnosis         string              `json:"diagnosis"`
	Confidence        string              `json:"confidence"`
	Steps             []string            `json:"steps"`
	ChemicalAdditions []map[string]string `json:"chemical_additions"`
	SafetyNotes       []string            `json:"safety_notes"`
	RetestInHours     int                 `json:"retest_in_hours"`
	WhenToCallPro     []string            `json:"when_to_call_pro"`
}

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
