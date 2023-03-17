function formatNaira(value: number) {
  const nairaSymbol = "\u{020A6}";
  return nairaSymbol + new Intl.NumberFormat("en-US").format(value);
}

export default formatNaira;
