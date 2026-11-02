import { prisma as defaultPrisma } from "../../config/prisma.js";
import type { UserResponse } from "./users.types.js";

/**
 * Retrieves the list of available travellers seeded in the system.
 */
export async function getUsers(prisma = defaultPrisma): Promise<UserResponse[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  return users.map((u) => ({
    id: Number(u.id),
    name: u.name,
  }));
}

