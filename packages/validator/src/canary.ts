/**
 * Canary Deployment Circuit Breaker & Automated Rollback Guard
 */

import { WaldSPRT, WaldSPRTOptions, SPRTDecision } from './sprt.js';

export interface CanaryGuardConfig {
  rollbackHandle: string;
  adapterId?: string;
  sprtOptions?: WaldSPRTOptions;
  onRollback?: (handle: string, evidence: string) => void;
  onPromote?: (evidence: string) => void;
}

export class CanaryGuard {
  public readonly rollbackHandle: string;
  public readonly adapterId?: string;
  private readonly sprt: WaldSPRT;
  private readonly onRollback?: (handle: string, evidence: string) => void;
  private readonly onPromote?: (evidence: string) => void;
  private isRolledBack = false;
  private isPromotedState = false;
  private evidenceLog: string[] = [];

  constructor(config: CanaryGuardConfig) {
    this.rollbackHandle = config.rollbackHandle;
    this.adapterId = config.adapterId;
    this.sprt = new WaldSPRT(config.sprtOptions);
    this.onRollback = config.onRollback;
    this.onPromote = config.onPromote;
  }

  /**
   * Records a live canary trial and triggers immediate circuit break if boundary crossed.
   */
  public recordTrial(isFailure: boolean): SPRTDecision {
    if (this.isRolledBack) {
      return 'rollback';
    }
    if (this.isPromotedState) {
      return 'promote';
    }

    const decision = this.sprt.step(isFailure);
    const sample = this.sprt.sampleCount;
    const errors = this.sprt.errorCount;
    const llr = this.sprt.logLikelihoodRatio.toFixed(3);

    if (decision === 'rollback') {
      this.isRolledBack = true;
      const evidence = `Canary tripped Wald upper boundary (LLR=${llr} >= ${this.sprt.upperThreshold.toFixed(3)}). Observed ${errors} failures out of ${sample} samples. Immediate rollback executed via ${this.rollbackHandle}.`;
      this.evidenceLog.push(evidence);
      if (this.onRollback) {
        this.onRollback(this.rollbackHandle, evidence);
      }
    } else if (decision === 'promote') {
      this.isPromotedState = true;
      const evidence = `Canary crossed Wald promotion boundary (LLR=${llr} <= ${this.sprt.lowerThreshold.toFixed(3)}). Observed ${errors} failures out of ${sample} samples. Safe to promote to 100% production traffic.`;
      this.evidenceLog.push(evidence);
      if (this.onPromote) {
        this.onPromote(evidence);
      }
    }

    return decision;
  }

  public isTripped(): boolean {
    return this.isRolledBack;
  }

  public isPromoted(): boolean {
    return this.isPromotedState;
  }

  public getEvidence(): string {
    return this.evidenceLog.join('\n');
  }

  public getStatus(): {
    decision: SPRTDecision;
    sampleCount: number;
    errorCount: number;
    logLikelihoodRatio: number;
    isTripped: boolean;
    isPromoted: boolean;
  } {
    return {
      decision: this.sprt.decision,
      sampleCount: this.sprt.sampleCount,
      errorCount: this.sprt.errorCount,
      logLikelihoodRatio: this.sprt.logLikelihoodRatio,
      isTripped: this.isRolledBack,
      isPromoted: this.isPromotedState,
    };
  }
}
