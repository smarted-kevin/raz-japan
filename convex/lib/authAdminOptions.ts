import { adminAc, userAc } from "better-auth/plugins/admin/access";

export const authAdminOptions = {
  adminRoles: ["admin", "god"],
  roles: {
    admin: adminAc,
    god: adminAc,
    user: userAc,
    org_admin: userAc,
  },
};
