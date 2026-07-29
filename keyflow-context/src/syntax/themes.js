// Maps token types to standard CSS custom properties
export const themeVariables = {
  keyword: '#cf222e',
  string: '#0a3069',
  comment: '#6e7781',
  number: '#0550ae',
  boolean: '#0550ae',
  null: '#0550ae',
  undefined: '#0550ae',
  operator: '#24292f',
  punctuation: '#24292f',
  identifier: '#24292f',
  function: '#8250df',
  class: '#953800',
  property: '#005cc5',
  decorator: '#8250df',
  text: '#24292f',
  whitespace: 'transparent'
};

export function getTokenStyle(type) {
  const styles = getComputedStyle(document.documentElement);
  const varName = `--color-code-${type}`;
  return styles.getPropertyValue(varName).trim() || themeVariables[type] || themeVariables.text;
}
