// Local Go-engine contract check. No SMTP, auth session, network or real tokens.
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html"
	"html/template"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

func must(err error) {
	if err != nil {
		panic(err)
	}
}
func assert(ok bool, message string) {
	if !ok {
		panic(message)
	}
}
func main() {
	callback := "https://example.test/auth/verify?token=fixture-only&type=confirmation&redirect_to=https%3A%2F%2Fexample.test%2F"
	cases := []struct {
		name   string
		data   any
		locale string
	}{
		{"tr", map[string]any{"ui_locale": "tr"}, "tr"}, {"en", map[string]any{"ui_locale": "en"}, "en"}, {"es", map[string]any{"ui_locale": "es"}, "es"},
		{"unknown", map[string]any{"ui_locale": "fr"}, "tr"}, {"empty", map[string]any{"ui_locale": ""}, "tr"}, {"missing", map[string]any{}, "tr"},
		{"nil-data", nil, "tr"}, {"null-locale", map[string]any{"ui_locale": nil}, "tr"},
		{"numeric", map[string]any{"ui_locale": 42}, "tr"}, {"boolean", map[string]any{"ui_locale": true}, "tr"},
		{"object", map[string]any{"ui_locale": map[string]any{"bad": "en"}}, "tr"}, {"array", map[string]any{"ui_locale": []string{"en"}}, "tr"},
	}
	href := regexp.MustCompile(`href="([^"]+)"`)
	total := 0
	for _, kind := range []string{"confirmation", "recovery"} {
		source, err := os.ReadFile(filepath.Join("supabase", "templates", kind+".html"))
		must(err)
		parsed, err := template.New(kind).Parse(string(source))
		must(err)
		for _, scenario := range cases {
			var out bytes.Buffer
			err = parsed.Execute(&out, map[string]any{"Data": scenario.data, "ConfirmationURL": callback})
			if err != nil {
				panic(fmt.Sprintf("%s/%s: %v", kind, scenario.name, err))
			}
			result := strings.TrimSpace(out.String())
			assert(strings.Count(strings.ToLower(result), "<!doctype html>") == 1, kind+" has multiple branches")
			assert(strings.Contains(result, `<html lang="`+scenario.locale+`">`), kind+" wrong locale: "+scenario.name)
			assert(!strings.Contains(result, "{{") && !strings.Contains(result, "ZgotmplZ"), kind+" unresolved/unsafe output")
			links := href.FindAllStringSubmatch(result, -1)
			assert(len(links) == 2, kind+" wrong link count")
			for _, link := range links {
				assert(html.UnescapeString(link[1]) == callback, kind+" callback changed")
			}
			raw, err := os.ReadFile(filepath.Join("locales", scenario.locale+".json"))
			must(err)
			var copy map[string]any
			must(json.Unmarshal(raw, &copy))
			title := copy["email"].(map[string]any)[kind].(map[string]any)["title"].(string)
			assert(strings.Contains(html.UnescapeString(result), title), kind+" missing localized title")
			if len(os.Args) == 3 && os.Args[1] == "--preview-dir" {
				must(os.MkdirAll(os.Args[2], 0755))
				must(os.WriteFile(filepath.Join(os.Args[2], kind+"-"+scenario.name+".html"), []byte(result), 0644))
			}
			total++
		}
	}
	fmt.Printf("Go HTML templates passed: %d cases (TR/EN/ES, missing/invalid locale, exact escaped callback)\n", total)
}
