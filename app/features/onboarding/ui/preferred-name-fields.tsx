import { onboardingText } from "~/content/onboarding";
import { FieldError } from "~/shared/ui/form";
import { Input } from "~/shared/ui/input";
import type { AddressForm } from "../domain/address-form";
import { ADDRESS_FORMS, DEFAULT_ADDRESS_FORM } from "../domain/address-form";

type PreferredNameFieldsProps = {
  defaultName?: string;
  defaultAddressForm?: AddressForm;
  errors?: Record<string, string[] | undefined>;
};

export function PreferredNameFields({
  defaultName = "",
  defaultAddressForm = DEFAULT_ADDRESS_FORM,
  errors,
}: PreferredNameFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <label htmlFor="preferredName" className="text-sm font-medium">
          {onboardingText.preferredName.nameLabel}
        </label>
        <Input
          id="preferredName"
          name="preferredName"
          autoComplete="nickname"
          maxLength={40}
          defaultValue={defaultName}
          placeholder={onboardingText.preferredName.namePlaceholder}
          required
          aria-invalid={Boolean(errors?.preferredName)}
          aria-describedby={errors?.preferredName ? "preferredName-error" : undefined}
        />
        <FieldError id="preferredName-error" message={errors?.preferredName?.[0]} />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{onboardingText.preferredName.addressLabel}</legend>
        <p className="text-xs text-muted-foreground">{onboardingText.preferredName.addressHelp}</p>
        <div className="grid gap-2">
          {ADDRESS_FORMS.map((form) => (
            <label
              key={form}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/5"
            >
              <input
                type="radio"
                name="addressForm"
                value={form}
                defaultChecked={form === defaultAddressForm}
                className="size-4 accent-primary"
              />
              {onboardingText.preferredName.options[form]}
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
