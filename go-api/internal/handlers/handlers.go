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
	var body struct {
		PoolID   string `json:"poolId"`
		Symptoms string `json:"symptoms"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)
	plan := services.BuildFallbackPlan(body.Symptoms)
	json.NewEncoder(w).Encode(map[string]any{"plan": plan})
}
