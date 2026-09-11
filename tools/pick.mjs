/**
 * Pick from one of the app's comboboxes. They are Discord's, not native
 * <select>s, so Playwright's selectOption does not apply: click the control,
 * then the option.
 */
export const pick = async (p, control, label) => {
  const dd = typeof control === 'string' ? p.locator(control) : control
  await dd.click()
  await p.locator('.dd-popout [role="option"]', { hasText: label }).first().click()
  await p.waitForTimeout(120)
}
