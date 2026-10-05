/*
  <Receipt> (DESIGN.md 5.8): a number that exists in facts.json, and a line
  that says what it counts. No counting animation.

    <Receipt value="4,000+" label="pull request comments" facts={['exp-rbc-desk-rates-fx']} />

  `facts` is required: a stat tile without a source cannot render, and the
  prerender fails the build if one is attempted.
*/
export default function Receipt({ value, label, facts, inline = false, className = '' }) {
  if (!Array.isArray(facts) || !facts.length || !label) {
    throw new Error(`Receipt "${value}" needs a label and the facts.json ids it comes from`)
  }
  return (
    <p className={`receipt ${inline ? 'receipt--inline' : ''} ${className}`.trim()} data-facts={facts.join(' ')}>
      <span className="receipt-value">{value}</span>
      <span className="receipt-label">{label}</span>
    </p>
  )
}
