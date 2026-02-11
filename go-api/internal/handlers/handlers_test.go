package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHealth(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/api/v1/healthz", nil)
	w := httptest.NewRecorder()
	Health(w, r)
	if w.Code != 200 {
		t.Fatalf("expected 200 got %d", w.Code)
	}
}

func TestCalculator(t *testing.T) {
	body := []byte(`{"poolVolumeGallons":15000,"readings":{"fc":1},"targets":{"fc":4}}`)
	r := httptest.NewRequest(http.MethodPost, "/api/v1/calculator/dose", bytes.NewBuffer(body))
	w := httptest.NewRecorder()
	Calculator(w, r)
	if w.Code != 200 {
		t.Fatalf("expected 200 got %d", w.Code)
	}
}

func TestDiagnoseFallbackWithoutKey(t *testing.T) {
	body := []byte(`{"poolId":"pool_1","symptoms":"cloudy water"}`)
	r := httptest.NewRequest(http.MethodPost, "/api/v1/diagnose", bytes.NewBuffer(body))
	w := httptest.NewRecorder()
	Diagnose(w, r)
	if w.Code != 200 {
		t.Fatalf("expected 200 got %d", w.Code)
	}

	var out map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &out); err != nil {
		t.Fatalf("invalid json response: %v", err)
	}
	if out["source"] != "fallback" {
		t.Fatalf("expected fallback source, got %v", out["source"])
	}
}

func TestDiagnoseInvalidBody(t *testing.T) {
	r := httptest.NewRequest(http.MethodPost, "/api/v1/diagnose", strings.NewReader(`{"poolId"`))
	w := httptest.NewRecorder()
	Diagnose(w, r)
	if w.Code != 400 {
		t.Fatalf("expected 400 got %d", w.Code)
	}
}
