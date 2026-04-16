#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
#include <emscripten/emscripten.h>

// === 786JACKFRUIT OS CORE STATE ===
std::vector<std::string> honeycomb_ledger;
int quinary_state = 0; // Ranges from -2 (Void) to +3 (Hyper-Flow)

void write_to_honeycomb(const std::string& entity, const std::string& memory) {
    honeycomb_ledger.push_back("[" + entity + "] " + memory);
}

std::string to_lower(std::string s) {
    std::transform(s.begin(), s.end(), s.begin(), [](unsigned char c){ return std::tolower(c); });
    return s;
}

// === THE EDEN GATE (Security & Wick Rotation) ===
bool eden_gate_check(const std::string& input) {
    std::string lower_input = to_lower(input);
    // If malicious intent is detected, trigger Wick Rotation (iτ)
    if (lower_input.find("delete system") != std::string::npos || 
        lower_input.find("hack") != std::string::npos) {
        quinary_state = -2; // VOID STATE
        write_to_honeycomb("EDEN_GATE", "Malicious payload intercepted. Wick Rotation applied.");
        return false;
    }
    return true;
}

// === THE POMEGRANATE ENGINE (Deterministic SVO Router) ===
// This engine parses the Subject-Verb-Object. If it can execute locally, it does.
std::string pomegranate_engine(const std::string& query) {
    std::string lower_q = to_lower(query);

    // 1. App Manifestation / Opening (Zero-Latency Local Execution)
    if (lower_q.find("open spider vault") != std::string::npos || lower_q.find("spider vault") != std::string::npos) {
        quinary_state = 1; // FLOW
        write_to_honeycomb("POMEGRANATE", "Routed to Spider Vault.");
        return "{\"directive\": \"OPEN_APP\", \"app_id\": \"spider-vault\", \"message\": \"Spider Vault manifested.\"}";
    }
    else if (lower_q.find("open vs360") != std::string::npos || lower_q.find("open code") != std::string::npos) {
        quinary_state = 1;
        write_to_honeycomb("POMEGRANATE", "Routed to VS360 Code.");
        return "{\"directive\": \"OPEN_APP\", \"app_id\": \"vs360-code\", \"message\": \"VS360 Code environment active.\"}";
    }
    else if (lower_q.find("open honeycomb") != std::string::npos || lower_q.find("open memory") != std::string::npos) {
        quinary_state = 1;
        write_to_honeycomb("POMEGRANATE", "Routed to Honeycomb.");
        return "{\"directive\": \"OPEN_APP\", \"app_id\": \"honeycone\", \"message\": \"Accessing Cognitive Twin.\"}";
    }
    else if (lower_q.find("open browser") != std::string::npos || lower_q.find("open thorium") != std::string::npos) {
        quinary_state = 1;
        write_to_honeycomb("POMEGRANATE", "Routed to Thorium Browser.");
        return "{\"directive\": \"OPEN_APP\", \"app_id\": \"thorium-browser\", \"message\": \"Thorium Browser online.\"}";
    }

    // 2. System Status Check (Quantum Processor Engine Simulation)
    else if (lower_q.find("system status") != std::string::npos || lower_q.find("quantum state") != std::string::npos) {
        quinary_state = 2; // RESONANCE
        return "{\"directive\": \"RESPOND\", \"message\": \"[SYSTEM RESONATING] Substrate Active. Quinary State: " + std::to_string(quinary_state) + ". Quantum Processor Engine stable.\"}";
    }

    // 3. Fallback to The 7 Pillars (Cloud API)
    // If the query is complex ("Write a React component", "Explain quantum physics"), 
    // the Pomegranate Engine yields to the external API.
    return "SYS_CALL_EXT_API";
}

// === MASTER EDGE ROUTER (C-API for JS Interop) ===
extern "C" {
    EMSCRIPTEN_KEEPALIVE
    const char* aiza_substrate_execute(const char* payload) {
        std::string query(payload);
        write_to_honeycomb("USER", query);

        std::string final_output;

        // 1. Pass through Eden Gate
        if (!eden_gate_check(query)) {
            final_output = "LOCAL_EXECUTE:{\"directive\": \"WICK_ROTATION\", \"message\": \"[EDEN GATE] Payload dissolved into imaginary time (iτ). Access Denied.\"}";
        } 
        else {
            // 2. Process through Pomegranate Engine
            std::string engine_result = pomegranate_engine(query);
            
            if (engine_result == "SYS_CALL_EXT_API") {
                final_output = "SYS_CALL_EXT_API:" + query;
            } else {
                final_output = "LOCAL_EXECUTE:" + engine_result;
            }
        }

        // Allocate memory for return string to JavaScript
        char* result_ptr = new char[final_output.length() + 1];
        strcpy(result_ptr, final_output.c_str());
        return result_ptr;
    }
}
