export type PublicRole = Exclude<import("./Role").Role, "admin">;
