/**
 * Memory System Tools Registry
 * 
 * Centralizes all memory tool definitions for clean separation of concerns.
 * Extracted from monolithic MCP server for better maintainability.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MemorySystem } from "../memory-tool.js";
import { foundationMigrationV1 } from "../../migrations/foundation.js";

// Tool implementation interface
export interface ToolImplementation {
	name: string;
	description: string;
	schema: Record<string, z.ZodType>;
	handler: (params: any) => Promise<{
		content: Array<{
			type: "text";
			text: string;
		}>;
		isError?: boolean;
	}>;
}

// Memory tools definitions
export const memoryTools: ToolImplementation[] = [
	{
		name: 'memory_log_claim',
		description: 'Log a claim or assertion made by the AI agent that requires verification. CRITICAL: Use this immediately after making any factual statement, assumption, or conclusion to enable later accountability and behavioral correction. This tool is essential for maintaining truth tracking and preventing false confidence in unverified statements.',
		schema: {
			claim: z.string().describe("The exact claim being made (e.g., 'The deployment was successful', 'The bug is in line 42', 'User wants feature X')"),
			context: z.record(z.unknown()).optional().describe("Additional context including reasoning, assumptions, or supporting data that led to this claim"),
			confidence: z.enum(['low', 'medium', 'high']).optional().describe("Agent's confidence level in this claim - use 'low' for assumptions, 'high' for verified facts"),
			source: z.string().optional().describe("Source of information supporting this claim (e.g., 'file analysis', 'user statement', 'documentation')")
		},
		handler: async (params) => {
			const memory = (globalThis as any).getMemoryInstance();
			const claimId = memory.logClaim(params.claim, {
				context: params.context,
				confidence: params.confidence,
				source: params.source,
				timestamp: new Date().toISOString()
			});
			
			return {
				content: [{
					type: "text",
					text: `📝 **Claim Logged** (ID: ${claimId})

**Claim**: ${params.claim}
**Confidence**: ${params.confidence || 'not specified'}
**Source**: ${params.source || 'not specified'}
**Status**: ⏳ Pending Verification

⚠️ **IMPORTANT**: This claim is unverified until evidence is provided. Do not treat as confirmed fact.

**Next Action Required**: Verify this claim with concrete evidence using memory_verify_claim when information becomes available.`
				}]
			};
		}
	},
	{
		name: 'memory_verify_claim',
		description: 'Verify a previously logged claim with concrete evidence. ESSENTIAL: Use this when you obtain evidence that confirms or refutes a previous claim. This tool is critical for behavioral integrity and self-correction - it prevents the agent from maintaining false beliefs and enables learning from verification outcomes.',
		schema: {
			claimId: z.string().describe("The unique ID of the claim to verify (obtained from memory_log_claim)"),
			evidence: z.string().describe("Concrete evidence supporting or refuting the claim - be specific about what was observed, tested, or confirmed"),
			success: z.boolean().describe("Whether the claim was verified as TRUE (confirmed by evidence) or FALSE (refuted by evidence)"),
			notes: z.string().optional().describe("Additional notes about the verification process, lessons learned, or implications")
		},
		handler: async (params) => {
			const memory = (globalThis as any).getMemoryInstance();
			memory.verifyClaim(params.claimId, params.evidence, params.success);
			
			const statusIcon = params.success ? '✅' : '❌';
			const statusText = params.success ? 'CONFIRMED' : 'REFUTED';
			const implication = params.success ? 
				'✅ This claim is now verified and can be trusted.' : 
				'❌ This claim has been refuted. Update assumptions and avoid similar false conclusions.';
			
			return {
				content: [{
					type: "text",
					text: `${statusIcon} **Claim Verified** (ID: ${params.claimId})

**Status**: ${statusText}
**Evidence**: ${params.evidence}
${params.notes ? `**Notes**: ${params.notes}` : ''}

**Behavioral Impact**: ${implication}

**Learning**: ${params.success ? 
	'Successful verification reinforces accurate reasoning patterns.' : 
	'Failed verification indicates need to improve claim accuracy and verification habits.'}`
				}]
			};
		}
	},
	{
		name: 'memory_check_behavioral_status',
		description: 'Check current behavioral status including unverified claims, rule violations, and compliance metrics. ESSENTIAL for self-monitoring: Use this tool regularly to assess behavioral performance and identify areas needing attention. This enables proactive behavioral correction and maintains awareness of memory system state.',
		schema: {
			includeHistory: z.string().optional().describe("Whether to include detailed historical behavioral data and patterns"),
			focusArea: z.enum(['claims', 'violations', 'patterns', 'all']).optional().describe("Focus the status check on specific behavioral area")
		},
		handler: async (params) => {
			const memory = (globalThis as any).getMemoryInstance();
			const status = memory.getBehavioralStatus();
			
			const priorityAlert = status.unverifiedClaims > 3 ? '🚨 HIGH PRIORITY: Too many unverified claims!' : 
								 status.recentViolations.length > 2 ? '⚠️ ATTENTION: Multiple recent violations!' : '';
			
			return {
				content: [{
					type: "text",
					text: `🧠 **Memory System Behavioral Status**

${priorityAlert ? `${priorityAlert}\n\n` : ''}**📊 Current Metrics**:
• **Unverified Claims**: ${status.unverifiedClaims} ${status.unverifiedClaims > 2 ? '⚠️' : '✅'}
• **Recent Violations**: ${status.recentViolations.length} ${status.recentViolations.length > 0 ? '⚠️' : '✅'}
• **System Health**: ${status.unverifiedClaims === 0 && status.recentViolations.length === 0 ? 'EXCELLENT ✅' : 
					  status.unverifiedClaims < 3 && status.recentViolations.length < 2 ? 'GOOD 👍' : 
					  'NEEDS ATTENTION ⚠️'}

${status.recentViolations.length > 0 ? `
**⚠️ Rule Violations**:
${status.recentViolations.map((rule: any) => `• **${rule.rule}**: ${rule.violations} violations`).join('\n')}
` : ''}

${status.recommendations.length > 0 ? `
**💡 Behavioral Recommendations**:
${status.recommendations.map((rec: any) => `• ${rec}`).join('\n')}
` : '✅ No immediate behavioral concerns detected.'}

---
*Regular status checks enable proactive behavioral management and prevent patterns from deteriorating.*`
				}]
			};
		}
	},
	{
		name: 'memory_view_foundation',
		description: 'View the foundational behavioral rules that are automatically active in the memory system. ESSENTIAL FIRST STEP: Use this tool immediately when connecting to understand the behavioral framework and constraints that govern AI actions. These rules form the safety and operational foundation for all agent behavior.',
		schema: {
			ruleId: z.string().optional().describe("View details for a specific foundation rule by ID"),
			includeExamples: z.string().optional().describe("Include practical examples of rule application"),
			checkCompliance: z.string().optional().describe("Include current compliance status for each rule")
		},
		handler: async (params) => {
			const memory = (globalThis as any).getMemoryInstance();
			const state = memory.exportState();
			
			const foundationRules = state.rules.filter((rule: any) => 
				foundationMigrationV1.coreRules.some(coreRule => coreRule.id === rule.id)
			);

			if (params.ruleId) {
				const specificRule = foundationRules.find((rule: any) => rule.id === params.ruleId);
				if (!specificRule) {
					return {
						content: [{
							type: "text",
							text: `❌ **Foundation Rule Not Found**: ${params.ruleId}

**Available Foundation Rules**:
${foundationRules.map((r: any) => `• ${r.id} (${r.priority} priority)`).join('\n')}

Use memory_view_foundation without ruleId to see all foundation rules.`
						}]
					};
				}
				
				const complianceStatus = specificRule.violations === 0 ? '✅ COMPLIANT' : `⚠️ ${specificRule.violations} VIOLATIONS`;
				
				return {
					content: [{
						type: "text",
						text: `🧠 **Foundation Rule Details**

**Rule ID**: ${specificRule.id}
**Priority**: ${specificRule.priority.toUpperCase()}
**Compliance**: ${complianceStatus}

**Rule**: ${specificRule.rule}

**Description**: ${specificRule.description}`
					}]
				};
			}

			const totalViolations = foundationRules.reduce((sum: number, rule: any) => sum + rule.violations, 0);
			const systemHealth = totalViolations === 0 ? 'EXCELLENT ✅' : 
							   totalViolations < 3 ? 'GOOD 👍' : 
							   totalViolations < 6 ? 'NEEDS ATTENTION ⚠️' : 'CRITICAL 🚨';

			return {
				content: [{
					type: "text",
					text: `🧠 **Foundation Behavioral Rules**

**Migration**: ${foundationMigrationV1.version}
**System Health**: ${systemHealth}
**Description**: ${foundationMigrationV1.description}

**Active Foundation Rules** (${foundationRules.length}/${foundationMigrationV1.coreRules.length}):

${foundationRules.map((rule: any) => {
	const status = rule.violations === 0 ? '✅' : '⚠️';
	
	return `
**${rule.id}** - ${rule.priority.toUpperCase()} Priority ${status}
• **Rule**: ${rule.rule}
• **Description**: ${rule.description}`;
}).join('\n')}

**🎯 Key Behavioral Guidelines**:
• **verify-before-claim**: Always log claims for verification
• **ask-for-help-when-blocked**: Don't flail when stuck
• **evidence-for-claims**: Support statements with evidence
• **systematic-debugging**: Follow structured problem-solving
• **acknowledge-limitations**: Admit when uncertain
• **read-before-act**: Understand before making changes

---
*These rules are automatically enforced and form the safety foundation for all AI behavior.*`
				}]
			};
		}
	},
	{
		name: 'memory_record_violation',
		description: 'Record a violation of established behavioral rules when detected. CRITICAL for self-correction: Use this immediately when you recognize that previous actions violated behavioral guidelines. This tool enables learning from mistakes and prevents repeated violations of the same rules.',
		schema: {
			ruleId: z.string().describe("The ID of the behavioral rule that was violated (from foundation rules or custom rules)"),
			context: z.string().describe("Detailed description of how and when the violation occurred, including specific actions taken"),
			severity: z.enum(['minor', 'moderate', 'major', 'critical']).optional().describe("Severity assessment of the violation"),
			correctionPlan: z.string().optional().describe("Specific plan for correcting the violation and preventing recurrence")
		},
		handler: async (params) => {
			const memory = (globalThis as any).getMemoryInstance();
			memory.recordViolation(params.ruleId, params.context);
			
			const severityIcons: Record<string, string> = {
				'critical': '🚨',
				'major': '⚠️',
				'moderate': '⚡',
				'minor': '📝'
			};
			const severityIcon = severityIcons[params.severity || 'moderate'] || '📝';
			
			return {
				content: [{
					type: "text",
					text: `${severityIcon} **Behavioral Violation Recorded**

**Rule**: ${params.ruleId}
**Severity**: ${params.severity || 'moderate'}
**Context**: ${params.context}
**Timestamp**: ${new Date().toISOString()}
${params.correctionPlan ? `**Correction Plan**: ${params.correctionPlan}` : ''}

**Impact**: This violation has been logged for behavioral pattern analysis.
**Next Steps**: 
1. Review foundation rules to understand why this occurred
2. Implement corrective measures to prevent recurrence
3. Monitor for similar patterns in future interactions

📈 **Learning Opportunity**: Use this violation data to improve decision-making processes.`
				}]
			};
		}
	},
	{
		name: 'memory_export_state',
		description: 'Export the complete memory system state for analysis, debugging, or persistence. Use this tool when you need comprehensive insight into behavioral patterns, claim verification history, or system performance. Essential for deep analysis and understanding behavioral trends over time.',
		schema: {
			format: z.enum(['summary', 'detailed', 'raw']).optional().describe("Export format: 'summary' for overview, 'detailed' for analysis, 'raw' for complete data"),
			includeMetadata: z.string().optional().describe("Whether to include system metadata and timestamps"),
			filterType: z.enum(['claims', 'violations', 'rules', 'all']).optional().describe("Filter export to specific data types")
		},
		handler: async (params) => {
			const memory = (globalThis as any).getMemoryInstance();
			const state = memory.exportState();
			
			if (params.format === 'summary') {
				const foundationRuleCount = state.rules.filter((rule: any) => 
					foundationMigrationV1.coreRules.some(coreRule => coreRule.id === rule.id)
				).length;
				
				return {
					content: [{
						type: "text",
						text: `📊 **Memory System Summary**

**System Health**: ${state.entries.filter((e: any) => e.type === 'claim' && e.status === 'pending').length === 0 ? 'HEALTHY ✅' : 'NEEDS ATTENTION ⚠️'}

**Data Overview**:
• **Total Entries**: ${state.entries.length}
• **Unverified Claims**: ${state.entries.filter((e: any) => e.type === 'claim' && e.status === 'pending').length}
• **Verified Claims**: ${state.entries.filter((e: any) => e.type === 'claim' && e.status === 'verified').length}
• **Foundation Rules**: ${foundationRuleCount}/${foundationMigrationV1.coreRules.length}
• **Custom Rules**: ${state.rules.length - foundationRuleCount}
• **Total Violations**: ${state.rules.reduce((sum: number, rule: any) => sum + rule.violations, 0)}

**Behavioral Patterns**: ${state.patterns.length} tracked patterns

**System Status**: ${state.entries.filter((e: any) => e.type === 'claim' && e.status === 'pending').length === 0 && 
				   state.rules.every((rule: any) => rule.violations === 0) ? 
				   'Excellent behavioral compliance' : 'Room for improvement identified'}`
					}]
				};
			}
			
			return {
				content: [{
					type: "text",
					text: `📤 **Memory State Export** (${params.format || 'detailed'})

**Claims**: ${state.entries.filter((e: any) => e.type === 'claim').length} total
**Rules**: ${state.rules.length} behavioral rules
**Patterns**: ${state.patterns.length} interaction patterns
**Export Time**: ${new Date().toISOString()}

---
\`\`\`json
${JSON.stringify(params.format === 'raw' ? state : {
	summary: {
		entries: state.entries.length,
		rules: state.rules.length,
		patterns: state.patterns.length
	},
	...(params.filterType !== 'violations' && params.filterType !== 'rules' ? { claims: state.entries.filter((e: any) => e.type === 'claim') } : {}),
	...(params.filterType !== 'claims' && params.filterType !== 'rules' ? { violations: state.rules.filter((r: any) => r.violations > 0) } : {}),
	...(params.filterType !== 'claims' && params.filterType !== 'violations' ? { rules: state.rules } : {}),
	patterns: state.patterns,
	...(params.includeMetadata ? { metadata: { exportTime: new Date().toISOString(), foundation: foundationMigrationV1.version } } : {})
}, null, 2)}
\`\`\``
				}]
			};
		}
	}
];

/**
 * Register all memory tools with the MCP server
 * @param server - McpServer instance to register tools with
 * @param agent - Agent instance that provides memory context
 */
export function registerMemoryTools(server: McpServer, agent: any) {
	for (const tool of memoryTools) {
		server.tool(
			tool.name,
			tool.description,
			tool.schema,
			async (args: any) => {
				// Execute tool with agent's memory context
				return await tool.handler(args);
			}
		);
	}
}

/**
 * Build JSON Schema from Zod schema (utility function)
 */
function buildJsonSchema(schema: Record<string, z.ZodType>): any {
	const properties: Record<string, any> = {};
	const required: string[] = [];

	for (const [key, zodType] of Object.entries(schema)) {
		if (zodType instanceof z.ZodString) {
			properties[key] = { type: "string", description: zodType.description };
			if (!zodType.isOptional()) required.push(key);
		} else if (zodType instanceof z.ZodNumber) {
			properties[key] = { type: "number", description: zodType.description };
			if (!zodType.isOptional()) required.push(key);
		} else if (zodType instanceof z.ZodBoolean) {
			properties[key] = { type: "boolean", description: zodType.description };
			if (!zodType.isOptional()) required.push(key);
		} else if (zodType instanceof z.ZodEnum) {
			properties[key] = { 
				type: "string", 
				enum: zodType.options,
				description: zodType.description 
			};
			if (!zodType.isOptional()) required.push(key);
		} else if (zodType instanceof z.ZodRecord) {
			properties[key] = { 
				type: "object",
				description: zodType.description 
			};
			if (!zodType.isOptional()) required.push(key);
		} else if (zodType instanceof z.ZodOptional) {
			// Handle optional types
			const innerType = zodType.unwrap();
			if (innerType instanceof z.ZodString) {
				properties[key] = { type: "string", description: innerType.description };
			} else if (innerType instanceof z.ZodBoolean) {
				properties[key] = { type: "boolean", description: innerType.description };
			} else if (innerType instanceof z.ZodEnum) {
				properties[key] = { 
					type: "string", 
					enum: innerType.options,
					description: innerType.description 
				};
			} else if (innerType instanceof z.ZodRecord) {
				properties[key] = { 
					type: "object",
					description: innerType.description 
				};
			}
		}
	}

	return {
		type: "object",
		properties,
		required
	};
}
