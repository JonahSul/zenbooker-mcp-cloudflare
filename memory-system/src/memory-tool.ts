/**
 * Tool-Enforced Memory System
 * 
 * This tool provides external scaffolding for AI behavior consistency by:
 * 1. Tracking claims and their verification status
 * 2. Enforcing behavioral rules
 * 3. Maintaining working memory across interactions
 * 4. Preventing known failure patterns (e.g., overconfidence, flailing)
 */

export interface MemoryEntry {
	id: string;
	timestamp: string;
	type: 'claim' | 'rule' | 'verification' | 'pattern' | 'assumption';
	content: string;
	status: 'pending' | 'verified' | 'failed' | 'enforced' | 'violated';
	evidence?: string;
	context?: Record<string, unknown>;
}

export interface BehavioralRule {
	id: string;
	rule: string;
	description: string;
	priority: 'critical' | 'high' | 'medium' | 'low';
	violations: number;
	lastViolation?: string;
}

export interface InteractionPattern {
	pattern: string;
	description: string;
	frequency: number;
	outcome: 'positive' | 'negative' | 'neutral';
	lastOccurrence: string;
}

export class MemorySystem {
	private entries: Map<string, MemoryEntry> = new Map();
	private rules: Map<string, BehavioralRule> = new Map();
	private patterns: Map<string, InteractionPattern> = new Map();

	constructor() {
		this.initializeCoreRules();
	}

	/**
	 * Initialize core behavioral rules that should always be enforced
	 */
	private initializeCoreRules(): void {
		const coreRules: BehavioralRule[] = [
			{
				id: 'no-unverified-claims',
				rule: 'Never claim something is "fixed" or "working" without verification',
				description: 'Must verify functionality through testing before claiming success',
				priority: 'critical',
				violations: 0
			},
			{
				id: 'ask-for-help',
				rule: 'Ask user for help when unable to observe expected output',
				description: 'Instead of flailing with repeated attempts, request user assistance',
				priority: 'critical',
				violations: 0
			},
			{
				id: 'evidence-required',
				rule: 'Provide evidence for all claims about system state',
				description: 'Back up statements with observable facts, test results, or user feedback',
				priority: 'high',
				violations: 0
			},
			{
				id: 'systematic-approach',
				rule: 'Break down complex problems into verifiable steps',
				description: 'Address one component at a time with verification at each step',
				priority: 'medium',
				violations: 0
			}
		];

		coreRules.forEach(rule => this.rules.set(rule.id, rule));
	}

	/**
	 * Log a claim that needs to be verified
	 */
	logClaim(content: string, context?: Record<string, unknown>): string {
		const id = this.generateId();
		const entry: MemoryEntry = {
			id,
			timestamp: new Date().toISOString(),
			type: 'claim',
			content,
			status: 'pending',
			...(context !== undefined && { context })
		};
		this.entries.set(id, entry);
		return id;
	}

	/**
	 * Log an assumption being made
	 */
	logAssumption(content: string, context?: Record<string, unknown>): string {
		const id = this.generateId();
		const entry: MemoryEntry = {
			id,
			timestamp: new Date().toISOString(),
			type: 'assumption',
			content,
			status: 'pending',
			...(context !== undefined && { context })
		};
		this.entries.set(id, entry);
		return id;
	}

	/**
	 * Verify a claim with evidence
	 */
	verifyClaim(claimId: string, evidence: string, success: boolean): void {
		const entry = this.entries.get(claimId);
		if (entry) {
			entry.status = success ? 'verified' : 'failed';
			entry.evidence = evidence;
		}
	}

	/**
	 * Check if there are unverified claims
	 */
	getUnverifiedClaims(): MemoryEntry[] {
		return Array.from(this.entries.values())
			.filter(entry => entry.type === 'claim' && entry.status === 'pending');
	}

	/**
	 * Record a rule violation
	 */
	recordViolation(ruleId: string, context: string): void {
		const rule = this.rules.get(ruleId);
		if (rule) {
			rule.violations++;
			rule.lastViolation = new Date().toISOString();
			
			// Log the violation as an entry
			this.entries.set(this.generateId(), {
				id: this.generateId(),
				timestamp: new Date().toISOString(),
				type: 'rule',
				content: `Violated rule: ${rule.rule}`,
				status: 'violated',
				context: { ruleId, description: context }
			});
		}
	}

	/**
	 * Initialize a behavioral rule (used by migrations)
	 */
	initializeBehavioralRule(rule: BehavioralRule): void {
		this.rules.set(rule.id, rule);
	}

	/**
	 * Get current behavioral status for pre-response checking
	 */
	getBehavioralStatus(): {
		unverifiedClaims: number;
		recentViolations: BehavioralRule[];
		recommendations: string[];
	} {
		const unverifiedClaims = this.getUnverifiedClaims().length;
		const recentViolations = Array.from(this.rules.values())
			.filter(rule => rule.violations > 0)
			.sort((a, b) => b.violations - a.violations);

		const recommendations: string[] = [];
		
		if (unverifiedClaims > 0) {
			recommendations.push(`You have ${unverifiedClaims} unverified claims. Verify before making new claims.`);
		}
		
		if (recentViolations.length > 0) {
			recommendations.push(`Recent rule violations: ${recentViolations.map(r => r.rule).join(', ')}`);
		}

		return {
			unverifiedClaims,
			recentViolations,
			recommendations
		};
	}

	/**
	 * Export current memory state for persistence
	 */
	exportState(): {
		entries: MemoryEntry[];
		rules: BehavioralRule[];
		patterns: InteractionPattern[];
	} {
		return {
			entries: Array.from(this.entries.values()),
			rules: Array.from(this.rules.values()),
			patterns: Array.from(this.patterns.values())
		};
	}

	private generateId(): string {
		return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}
