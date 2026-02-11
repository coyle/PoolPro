package handlers

import (
	"encoding/json"
	"net/http"

	"poolpro/go-api/internal/services"
)

func Health(w http.ResponseWriter, _ *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func Calculator(w http.ResponseWriter, r *http.Request) {
	var in services.CalcInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	json.NewEncoder(w).Encode(services.CalculateDosing(in))
}

func Diagnose(w http.ResponseWriter, r *http.Request) {
	var body services.DiagnoseRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&body); err != nil {
		http.Error(w, "invalid JSON body", http.StatusBadRequest)
		return
	}
	if err := services.ValidateDiagnoseRequest(body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	plan := services.BuildFallbackPlanWithContext(body.Symptoms, body.Context)
	source := "fallback"
	var warning string
	if services.HasOpenAIKey() {
		if llmPlan, err := services.GenerateDiagnosePlan(body.Symptoms, body.Context); err == nil {
			plan = llmPlan
			source = "llm"
		} else {
			warning = "LLM response unavailable or invalid; returned conservative fallback plan."
		}
	}
	resp := map[string]any{"plan": plan, "source": source}
	if warning != "" {
		resp["warning"] = warning
	}
	json.NewEncoder(w).Encode(resp)
}
