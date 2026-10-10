import {
  Observation,
  Contract,
  Change,
  Impact,
  Adapter,
  ValidationResult,
  MigrationProposal,
} from '@intra/shared';
import { ObservationCollector } from '@intra/observer';
import { inferContract } from '@intra/model';
import { detectChanges } from '@intra/differ';
import { ImpactAnalyzer } from '@intra/impact';
import { SafeHandlingEngine, HandlingDecision } from '@intra/adapter';
import { WorkflowValidator, WorkflowReplayTest } from '@intra/validator';

export interface PipelineResult {
  observationsCount: number;
  contracts: Record<string, Contract>;
  changes: Change[];
  impacts: Impact[];
  decisions: HandlingDecision[];
  validations: ValidationResult[];
}

export class PipelineEngine {
  public collector: ObservationCollector;
  public baselines: Map<string, Contract> = new Map();
  public activeContracts: Map<string, Contract> = new Map();
  public detectedChanges: Map<string, Change> = new Map();
  public impacts: Map<string, Impact> = new Map();
  public adapters: Map<string, Adapter> = new Map();
  public proposals: Map<string, MigrationProposal> = new Map();
  public validationResults: Map<string, ValidationResult> = new Map();

  private impactAnalyzer: ImpactAnalyzer;
  private safeHandling: SafeHandlingEngine;
  private validator: WorkflowValidator;

  constructor() {
    this.collector = new ObservationCollector();
    this.impactAnalyzer = new ImpactAnalyzer();
    this.safeHandling = new SafeHandlingEngine();
    this.validator = new WorkflowValidator();
  }

  public recordObservation(obsOptions: Parameters<ObservationCollector['record']>[0]): Observation {
    return this.collector.record(obsOptions);
  }

  public establishBaseline(service: string, endpoint: string): Contract {
    const key = `${service.toLowerCase()}:${endpoint.toLowerCase()}`;
    const obs = this.collector.getByEndpoint(service, endpoint);
    if (obs.length === 0) {
      throw new Error(`Cannot baseline without observations for ${service}:${endpoint}`);
    }
    const contract = inferContract(obs);
    this.baselines.set(key, contract);
    this.activeContracts.set(key, contract);
    return contract;
  }

  public runPipeline(): PipelineResult {
    const contracts: Record<string, Contract> = {};
    const newChanges: Change[] = [];
    const impactsList: Impact[] = [];
    const decisionsList: HandlingDecision[] = [];
    const validationsList: ValidationResult[] = [];

    // Group observations by service:endpoint
    const allObs = this.collector.getAll();
    const grouped = new Map<string, Observation[]>();

    for (const obs of allObs) {
      const key = `${obs.service.toLowerCase()}:${obs.endpoint.toLowerCase()}`;
      const list = grouped.get(key) || [];
      list.push(obs);
      grouped.set(key, list);
    }

    for (const [key, obsList] of grouped.entries()) {
      if (obsList.length === 0) continue;

      const baseline = this.baselines.get(key);
      if (baseline) {
        // Windowed observations: evaluate recent window against established baseline
        const windowObs = obsList.length > 1 ? obsList.slice(-Math.min(obsList.length - 1, 5)) : obsList;
        const currentContract = inferContract(windowObs);
        this.activeContracts.set(key, currentContract);
        contracts[key] = currentContract;

        // Compare against baseline
        const changes = detectChanges(
          baseline,
          currentContract,
          windowObs.map((o) => o.id)
        );

        for (const change of changes) {
          this.detectedChanges.set(change.id, change);
          newChanges.push(change);

          // Impact analysis
          const impact = this.impactAnalyzer.analyze(change);
          this.impacts.set(change.id, impact);
          impactsList.push(impact);

          // Adapter generation & Safe Handling Policy
          const decision = this.safeHandling.evaluate(change);
          decisionsList.push(decision);

          if (decision.proposal) {
            this.proposals.set(decision.proposal.id, decision.proposal);
          }

          if (decision.adapter) {
            this.adapters.set(decision.adapter.id, decision.adapter);

            // Validation step: execute synthesized adapter against real recorded payloads
            const replayTests: WorkflowReplayTest[] = impact.affectedWorkflows.map((wf) => {
              const goldenInput = obsList[0]?.body ?? {};
              const mutatedPayload = windowObs[windowObs.length - 1]?.body ?? goldenInput;

              let actualAdaptedOutput = mutatedPayload;
              try {
                const cleanCode = decision.adapter!.code.replace(/export\s+/g, '');
                const fn = new Function(
                  `${cleanCode}; return typeof adaptResponse === 'function' ? adaptResponse : (typeof adaptRequest === 'function' ? adaptRequest : (d) => d);`
                )();
                actualAdaptedOutput = fn(mutatedPayload);
              } catch {
                actualAdaptedOutput = mutatedPayload;
              }

              return {
                workflowName: wf,
                goldenInput,
                expectedOutput: goldenInput,
                actualAdaptedOutput,
              };
            });

            const valResult = this.validator.validate(decision.adapter, replayTests);
            this.validationResults.set(decision.adapter.id, valResult);
            validationsList.push(valResult);
          }
        }
      } else {
        // First time seeing endpoint: infer and establish as baseline
        const baselineContract = inferContract(obsList);
        this.baselines.set(key, baselineContract);
        this.activeContracts.set(key, baselineContract);
        contracts[key] = baselineContract;
      }
    }

    return {
      observationsCount: allObs.length,
      contracts,
      changes: newChanges,
      impacts: impactsList,
      decisions: decisionsList,
      validations: validationsList,
    };
  }
}
