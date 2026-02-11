package services

import "testing"

func TestCalculateDosingNeedsVolume(t *testing.T) {
	out := CalculateDosing(CalcInput{Readings: map[string]float64{"fc": 1}, Targets: map[string]float64{"fc": 4}})
	if out.Confidence != "Low" {
		t.Fatalf("expected Low confidence, got %s", out.Confidence)
	}
}

func TestCalculateDosingChlorine(t *testing.T) {
	out := CalculateDosing(CalcInput{
		PoolVolumeGallons: 10000,
		Readings:          map[string]float64{"fc": 1, "cya": 30},
		Targets:           map[string]float64{"fc": 3},
	})
	if len(out.Doses) == 0 {
		t.Fatalf("expected at least one dose")
	}
}
