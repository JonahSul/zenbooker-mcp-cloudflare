/**
 * Types for the tool-enforced memory system
 */

export interface MemoryEntry {
	id: string;
	timestamp: string;
	type: 'assumption' | 'claim' | 'verification' | 'rule' | 'pattern';
	content: string;
	evidence?: string;
	verified: boolean;
	session_id: string;
}

export interface BehavioralRule {
	id: string;
	name: string;
	description: string;
	trigger_pattern: string;
	required_action: string;
	violations: number;
	created: string;
}

export interface InteractionPattern {
	id: string;
	pattern_name: string;
	description: string;
	failure_indicators: string[];
	success_indicators: string[];
	last_occurrence: string;
	frequency: number;
}

export interface MemoryResponse {
	entries: MemoryEntry[];
	rules: BehavioralRule[];
	patterns: InteractionPattern[];
	session_summary: string;
}
