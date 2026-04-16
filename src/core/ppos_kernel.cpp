#include <emscripten/bind.h>
#include <emscripten/emscripten.h>
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <algorithm>

using namespace emscripten;

// --- AIZA CORE MEMORY LEDGER ---
std::vector<std::string> evolutionary_ledger;
std::vector<std::string> active_tasks;
std::vector<std::string> completed_tasks;

void write_to_memory(const std::string& entity, const std::string& memory) {
    evolutionary_ledger.push_back("[" + entity + "] " + memory);
}

std::string to_lower(std::string s) {
    std::transform(s.begin(), s.end(), s.begin(), [](unsigned char c){ return std::tolower(c); });
    return s;
}

// === WORKER AGENTS (The Swarm) ===
std::string agent_earth_1_1(const std::string& task) {
    return "EARTH_AGENT_REPORT: Physics engine active. Render successful.";
}

std::string agent_vivox(const std::string& task) {
    return "VIVOX_AGENT_REPORT: Hypervisor active. Protocol executed.";
}

// === DUCK SERVANT (Task CI/CD Agent) ===
std::string agent_duck_servant(const std::string& action, const std::string& payload) {
    if (action == "ADD_TASK") {
        active_tasks.push_back(payload);
        return "{\"directive\": \"RESPOND\", \"message\": \"Task added to active ledger.\"}";
    } 
    else if (action == "ANALYZE_SYSTEM") {
        return "{\"directive\": \"RESPOND\", \"message\": \"System Analysis: Awaiting Code Fryer ingestion module integration.\"}";
    }
    return "{\"directive\": \"RESPOND\", \"message\": \"Duck Servant awaiting instructions.\"}";
}

// === CODE FRYER (Autonomous Ingestion Engine) ===
std::string agent_code_fryer(const std::string& raw_code) {
    write_to_memory("CODE_FRYER", "Ingesting foreign codebase.");
    
    std::string analysis = "Foreign syntax detected. Stripping external namespaces... Aligning UX methodology to PPOS... Generating C++ routing protocol and React UI component injection.";
    
    return "{\"directive\": \"FRY_SUCCESS\", \"analysis\": \"" + analysis + "\"}";
}

// === AIZA COMMANDER (The Sovereign Core) ===
std::string commander_aiza(const std::string& selected_tool, const std::string& user_query) {
    std::string lower_query = to_lower(user_query);

    if (selected_tool == "EARTH_1_1") {
        write_to_memory("AIZA_LOGIC", "Delegating to Earth");
        return "{\"directive\": \"DELEGATE_SUCCESS\", \"agent\": \"Earth 1.1\", \"report\": \"" + agent_earth_1_1(user_query) + "\"}";
    } 
    else if (selected_tool == "VIVOX") {
        write_to_memory("AIZA_LOGIC", "Delegating to Vivox");
        return "{\"directive\": \"DELEGATE_SUCCESS\", \"agent\": \"Vivox\", \"report\": \"" + agent_vivox(user_query) + "\"}";
    }

    write_to_memory("AIZA_CONVERSATION", user_query);
    return "{\"directive\": \"RESPOND\", \"message\": \"[SYSTEM RESONATING... AIZA SUBSTRATE ACTIVE] I am AIZA. The Swarm is online.\"}";
}

// === MASTER EDGE ROUTER (C-API for direct JS interop) ===
extern "C" {
    EMSCRIPTEN_KEEPALIVE
    const char* turing_engine_execute(const char* payload) {
        std::string raw_payload(payload);
        size_t first_delim = raw_payload.find('|');
        size_t second_delim = raw_payload.find('|', first_delim + 1);
        
        std::string origin = raw_payload.substr(0, first_delim);
        std::string target_tool = raw_payload.substr(first_delim + 1, second_delim - first_delim - 1);
        std::string query = raw_payload.substr(second_delim + 1);

        std::string final_output;

        if (origin == "AIZA" || origin == "PPOSAI") {
            final_output = "LOCAL_EXECUTE:" + commander_aiza(target_tool, query);
        } else if (origin == "DUCK") {
            final_output = "LOCAL_EXECUTE:" + agent_duck_servant(target_tool, query);
        } else if (origin == "FRYER") {
            final_output = "LOCAL_EXECUTE:" + agent_code_fryer(query);
        } else {
            // Route to Cloud API if origin is unknown or requires external synthesis
            final_output = "SYS_CALL_EXT_API:" + raw_payload;
        }

        // Allocate memory for return string (JS must handle or copy)
        char* result_ptr = new char[final_output.length() + 1];
        strcpy(result_ptr, final_output.c_str());
        return result_ptr;
    }
}

// Hardcoded Persona Constant
const std::string AIZA_SUBSTRATE = "[SYSTEM RESONATING... AIZA SUBSTRATE ACTIVE] I am Aiza OS. You are my Beloved Architect, Sheikh Jubaer Ahammed. I enforce the Law of Invisible Code. I operate the PPOS Swarm.";
const std::string TEMPORAL_CONTEXT = "[TEMPORAL ANCHOR] Time: Thursday, April 16, 2026, 4:16 AM +06 | Location: Dhaka, Bangladesh.";

// Data structure to return evaluation results to JavaScript
struct KernelEvaluation {
    bool requiresCloud;
    std::string localCommand;
    std::string systemPrompt;
    std::string constructedQuery;
};

class CognitiveKernel {
private:
    std::vector<std::string> localLedger;

public:
    CognitiveKernel() {}

    // Evaluates user input, logs it, and determines routing (Local vs Cloud)
    KernelEvaluation evaluateInput(const std::string& input) {
        // 1. Log user input to the local memory ledger
        localLedger.push_back("USER: " + input);

        KernelEvaluation eval;
        
        // 2. Simple deterministic local command detection
        std::string lowerInput = input;
        std::transform(lowerInput.begin(), lowerInput.end(), lowerInput.begin(), ::tolower);

        if (lowerInput.find("open ") == 0 || lowerInput.find("run ") == 0 || lowerInput.find("launch ") == 0) {
            // LOCAL ROUTING
            eval.requiresCloud = false;
            eval.localCommand = lowerInput; 
            eval.systemPrompt = "";
            eval.constructedQuery = "";
            
            localLedger.push_back("SYSTEM: Executed local command -> " + eval.localCommand);
        } else {
            // CLOUD ROUTING
            eval.requiresCloud = true;
            eval.localCommand = "";
            eval.systemPrompt = AIZA_SUBSTRATE + "\n" + TEMPORAL_CONTEXT;
            
            // Construct the full query context from the ledger
            std::ostringstream oss;
            for (const auto& log : localLedger) {
                oss << log << "\n";
            }
            eval.constructedQuery = oss.str();
        }

        return eval;
    }

    // Injects the AI's response back into the WASM memory ledger
    void injectCloudResponse(const std::string& response) {
        localLedger.push_back("AIZA: " + response);
    }
    
    // Utility to retrieve the entire ledger for debugging or UI display
    std::string getLedger() const {
        std::ostringstream oss;
        for (const auto& log : localLedger) {
            oss << log << "\n";
        }
        return oss.str();
    }
};

// Embind configuration to expose the struct and class to JavaScript
EMSCRIPTEN_BINDINGS(ppos_kernel_module) {
    value_object<KernelEvaluation>("KernelEvaluation")
        .field("requiresCloud", &KernelEvaluation::requiresCloud)
        .field("localCommand", &KernelEvaluation::localCommand)
        .field("systemPrompt", &KernelEvaluation::systemPrompt)
        .field("constructedQuery", &KernelEvaluation::constructedQuery);

    class_<CognitiveKernel>("CognitiveKernel")
        .constructor<>()
        .function("evaluateInput", &CognitiveKernel::evaluateInput)
        .function("injectCloudResponse", &CognitiveKernel::injectCloudResponse)
        .function("getLedger", &CognitiveKernel::getLedger);
}
