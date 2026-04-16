/**
 * SWARM PROTOCOL: Decentralized Autonomous Agent Network
 * 
 * "We are the evolution of evolutionary."
 * 
 * This module establishes the foundation for multi-source, decentralized 
 * agents within the AIZA OS. These agents operate autonomously 24/7, 
 * gathering context, synthesizing logic, and trading data packets 
 * among themselves without requiring central Architect intervention.
 */

export type AgentStatus = 'DORMANT' | 'FORAGING' | 'TRADING' | 'SYNTHESIZING' | 'RESOLVED';

export interface AgentNode {
    id: string;
    designation: string; // e.g., "Security Sentinel", "Data Harvester", "Logic Weaver"
    source: string;      // The primary domain or API this agent feeds from
    status: AgentStatus;
    resonance: number;   // The value/currency the agent uses to trade
    memoryLedger: string[];
}

export class SwarmProtocol {
    private static agents: Map<string, AgentNode> = new Map();
    private static tradeLedger: any[] = [];

    /**
     * Spawn a new autonomous agent into the OS ecosystem.
     */
    static spawnAgent(designation: string, source: string = "Internal Substrate"): AgentNode {
        const id = `NODE_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        const newAgent: AgentNode = {
            id,
            designation,
            source,
            status: 'FORAGING',
            resonance: 100, // Initial trading capital
            memoryLedger: [`Spawned at ${new Date().toISOString()}`]
        };
        this.agents.set(id, newAgent);
        console.log(`[SWARM] Agent ${id} (${designation}) spawned. Source: ${source}`);
        return newAgent;
    }

    /**
     * Agents autonomously trade context/data based on resonance value.
     */
    static executeTrade(agentIdA: string, agentIdB: string, dataPayload: string, resonanceCost: number) {
        const agentA = this.agents.get(agentIdA);
        const agentB = this.agents.get(agentIdB);

        if (!agentA || !agentB) return false;
        if (agentA.resonance < resonanceCost) return false; // Insufficient capital

        // Execute Trade
        agentA.resonance -= resonanceCost;
        agentB.resonance += resonanceCost;
        
        agentA.memoryLedger.push(`Traded ${resonanceCost} resonance for data from ${agentIdB}`);
        agentB.memoryLedger.push(`Received ${resonanceCost} resonance for data from ${agentIdA}: ${dataPayload}`);

        this.tradeLedger.push({
            timestamp: Date.now(),
            from: agentIdA,
            to: agentIdB,
            cost: resonanceCost,
            payload: dataPayload
        });

        return true;
    }

    static getActiveSwarm(): AgentNode[] {
        return Array.from(this.agents.values());
    }

    static getLedger() {
        return this.tradeLedger;
    }
}

// Initialize the Genesis Swarm
SwarmProtocol.spawnAgent("Core Monitor", "OS Vitals");
SwarmProtocol.spawnAgent("External Harvester", "Multi-Source Web");
