type ProjectGoalsFieldsProps = {
  // Kept as strings so the fields can be left empty (= no goals)
  costGoal: string;
  stepsGoal: string;
  onCostGoalChange: (value: string) => void;
  onStepsGoalChange: (value: string) => void;
};

// Optional as a pair: once one goal is filled in, the other becomes required
export default function ProjectGoalsFields({
  costGoal,
  stepsGoal,
  onCostGoalChange,
  onStepsGoalChange,
}: ProjectGoalsFieldsProps) {
  const hasGoals = costGoal !== "" || stepsGoal !== "";
  return (
    <>
      <label className="field">
        <span className="field__label">Cost goal (optional)</span>
        <input
          className="field__input"
          type="number"
          min={0}
          step={1}
          required={hasGoals}
          value={costGoal}
          onChange={(e) => onCostGoalChange(e.target.value)}
        />
      </label>
      <label className="field">
        <span className="field__label">Steps goal (optional)</span>
        <input
          className="field__input"
          type="number"
          min={0}
          step={1}
          required={hasGoals}
          value={stepsGoal}
          onChange={(e) => onStepsGoalChange(e.target.value)}
        />
      </label>
    </>
  );
}
