export function asVoidAction(
  action: ((formData: FormData) => Promise<unknown>) | (() => Promise<unknown>),
) {
  return async (formData: FormData): Promise<void> => {
    await (action as (formData: FormData) => Promise<unknown>)(formData);
  };
}
