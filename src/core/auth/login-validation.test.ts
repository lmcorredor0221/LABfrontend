import { validateLoginCredentials } from "@/core/auth/login-validation";

describe("login validation", () => {
  it("requires both email and password", () => {
    expect(
      validateLoginCredentials({
        email: "",
        password: "",
      }),
    ).toEqual({
      email: "Ingresa tu correo electronico.",
      password: "Ingresa tu contrasena.",
    });
  });

  it("rejects malformed emails", () => {
    expect(
      validateLoginCredentials({
        email: "leanbuilder.local",
        password: "secret",
      }),
    ).toEqual({
      email: "Ingresa un correo valido.",
    });
  });
});
