import { PrismaClient, UserRole, EventCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "senha1234";

// Dados de demonstração para o dashboard (RF09): 2 organizadores,
// eventos em categorias distintas e inscrições gerando ocupação variada.
async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);

  const users: { name: string; email: string; role: UserRole }[] = [
    { name: "Organizador A", email: "orga@eventhub.com", role: "ORGANIZER" },
    { name: "Organizador B", email: "orgb@eventhub.com", role: "ORGANIZER" },
    { name: "Participante 1", email: "participante@eventhub.com", role: "PARTICIPANT" },
    { name: "Participante 2", email: "participante2@eventhub.com", role: "PARTICIPANT" },
    { name: "Participante 3", email: "participante3@eventhub.com", role: "PARTICIPANT" },
  ];

  const byEmail: Record<string, string> = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: hash },
    });
    byEmail[u.email] = user.id;
  }

  const daysFromNow = (d: number) => new Date(Date.now() + d * 864e5);

  const events: {
    name: string;
    category: EventCategory;
    totalSlots: number;
    organizer: string;
    days: number;
  }[] = [
    { name: "Palestra IA Generativa", category: "PALESTRA", totalSlots: 50, organizer: "orga@eventhub.com", days: 7 },
    { name: "Workshop React", category: "WORKSHOP", totalSlots: 3, organizer: "orga@eventhub.com", days: 14 },
    { name: "Minicurso Docker", category: "MINICURSO", totalSlots: 10, organizer: "orgb@eventhub.com", days: 7 },
    { name: "Seminario Seguranca", category: "SEMINARIO", totalSlots: 5, organizer: "orgb@eventhub.com", days: 14 },
  ];

  const eventIds: Record<string, string> = {};
  for (const e of events) {
    const organizerId = byEmail[e.organizer];
    let ev = await prisma.event.findFirst({ where: { name: e.name, organizerId } });
    if (!ev) {
      ev = await prisma.event.create({
        data: {
          name: e.name,
          description: `Evento de demonstração: ${e.name}`,
          category: e.category,
          date: daysFromNow(e.days),
          location: "Campus",
          totalSlots: e.totalSlots,
          organizerId,
        },
      });
    }
    eventIds[e.name] = ev.id;
  }

  // Inscrições: (participante -> eventos). Workshop React lota (3/3).
  const regs: [string, string][] = [
    ["participante@eventhub.com", "Palestra IA Generativa"],
    ["participante@eventhub.com", "Workshop React"],
    ["participante@eventhub.com", "Minicurso Docker"],
    ["participante2@eventhub.com", "Palestra IA Generativa"],
    ["participante2@eventhub.com", "Workshop React"],
    ["participante2@eventhub.com", "Seminario Seguranca"],
    ["participante3@eventhub.com", "Palestra IA Generativa"],
    ["participante3@eventhub.com", "Workshop React"],
  ];

  for (const [email, eventName] of regs) {
    const userId = byEmail[email];
    const eventId = eventIds[eventName];
    const existing = await prisma.registration.findFirst({ where: { userId, eventId } });
    if (existing) continue;
    await prisma.registration.create({ data: { userId, eventId, status: "CONFIRMED" } });
  }

  // Recalcula usedSlots e status de cada evento conforme inscrições confirmadas.
  for (const eventId of Object.values(eventIds)) {
    const confirmed = await prisma.registration.count({ where: { eventId, status: "CONFIRMED" } });
    const ev = await prisma.event.findUnique({ where: { id: eventId } });
    if (!ev) continue;
    await prisma.event.update({
      where: { id: eventId },
      data: { usedSlots: confirmed, status: confirmed >= ev.totalSlots ? "FULL" : "AVAILABLE" },
    });
  }

  console.log("Seed concluído. Login de demo (senha: %s):", PASSWORD);
  console.log("  Organizadores: orga@eventhub.com, orgb@eventhub.com");
  console.log("  Participantes: participante@eventhub.com, participante2@eventhub.com, participante3@eventhub.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
