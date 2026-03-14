import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function AuthStore() {
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);

  useEffect(() => {
    // Create or update the user in the database after login
    createOrUpdateUser();
  }, [createOrUpdateUser]);

  return null;
}
