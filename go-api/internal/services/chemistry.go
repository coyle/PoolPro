package services

import "math"

type CalcInput struct {
	PoolVolumeGallons float64            `json:"poolVolumeGallons"`
	Readings          map[string]float64 `json:"readings"`
	Targets           map[string]float64 `json:"targets"`
	ProductStrengths  map[string]float64 `json:"productStrengths"`
}

type Dose struct {
	Chemical string  `json:"chemical"`
	Amount   float64 `json:"amount"`
	Unit     string  `json:"unit"`
	Notes    string  `json:"notes"`
}

type CalcOutput struct {
	Confidence  string   `json:"confidence"`
	Doses       []Dose   `json:"doses"`
	Assumptions []string `json:"assumptions"`
	SafetyNotes []string `json:"safetyNotes"`
	Missing     []string `json:"missingFields"`
	RetestHours int      `json:"retestInHours"`
}

func CalculateDosing(in CalcInput) CalcOutput {
	out := CalcOutput{RetestHours: 4, Confidence: "Medium", Assumptions: []string{"Conservative first-step dosing."}, SafetyNotes: []string{"Always retest before additional dosing."}}
	if in.PoolVolumeGallons <= 0 {
		out.Missing = append(out.Missing, "poolVolumeGallons")
		out.Confidence = "Low"
		return out
	}
	pool := in.PoolVolumeGallons
	lc := in.ProductStrengths["liquidChlorinePercent"]
	if lc == 0 {
		lc = 10
	}
	if t, ok := in.Targets["fc"]; ok {
		if r, ok2 := in.Readings["fc"]; ok2 && t > r {
			delta := t - r
			oz := math.Min((delta*pool)/(10000*lc)*128, 512)
			out.Doses = append(out.Doses, Dose{"liquid_chlorine", round(oz), "oz", "Add half, circulate, retest."})
		}
	}
	if t, ok := in.Targets["ta"]; ok {
		if r, ok2 := in.Readings["ta"]; ok2 && t > r {
			lbs := math.Min(((t-r)/10)*(pool/10000)*1.4, 25)
			out.Doses = append(out.Doses, Dose{"sodium_bicarbonate", round(lbs), "lb", "Split additions."})
		}
	}
	if _, ok := in.Readings["cya"]; !ok {
		out.Missing = append(out.Missing, "cya")
	}
	if len(out.Missing) > 0 {
		out.Confidence = "Low"
	}
	return out
}

func round(v float64) float64 { return math.Round(v*10) / 10 }
