import { prisma } from "./prisma";
import { searchPlaces } from "./places";
import { sortEventsChronologically } from "./utils";

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-flash-latest"];

// Context builder specifically for the Planner AI
export async function buildPlannerTripContext(tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: { events: true },
      },
      hotels: true,
      flights: true,
      transportation: true,
      savedPlaces: true,
    },
  });
  if (!trip) throw new Error("Trip not found");

  const lines: string[] = [];
  lines.push(`TRIP: ${trip.title}`);
  lines.push(`DESTINATION: ${trip.destination} (${trip.country})`);
  lines.push(`DATES: ${trip.startDate.toISOString().slice(0,10)} to ${trip.endDate.toISOString().slice(0,10)}`);
  if (trip.notes) lines.push(`TRAVELER NOTES: ${trip.notes}`);
  lines.push("");

  lines.push("LOGISTICS (Flights, Hotels, Transportation):");
  if (trip.flights.length > 0) {
    lines.push("  FLIGHTS:");
    for (const f of trip.flights) {
      lines.push(`    - ${f.airline} ${f.flightNumber} | Departs: ${f.flightDate || "N/A"} from ${f.departureAirport} | Arrives: ${f.arrivalAirport}`);
    }
  }
  if (trip.hotels.length > 0) {
    lines.push("  HOTELS:");
    for (const h of trip.hotels) {
      lines.push(`    - ${h.name} | Check-in: ${h.checkInDate?.toISOString().slice(0,10) || "N/A"} | Check-out: ${h.checkOutDate?.toISOString().slice(0,10) || "N/A"} | Address: ${h.address || ""}`);
    }
  }
  if (trip.transportation.length > 0) {
    lines.push("  TRANSPORTATION:");
    for (const t of trip.transportation) {
      lines.push(`    - [${t.type}] ${t.company || "Unknown"} | Departs: ${t.departureTime || "N/A"} from ${t.fromLocation || "Unknown"} | Arrives: ${t.toLocation || "Unknown"}`);
    }
  }
  if (trip.flights.length === 0 && trip.hotels.length === 0 && trip.transportation.length === 0) {
    lines.push("  (No logistics saved)");
  }
  lines.push("");

  lines.push("ITINERARY (DAYS):");
  for (const day of trip.days) {
    lines.push(`  Day ${day.dayNumber} [Day ID: ${day.id}] — Date: ${day.date.toISOString().slice(0,10)}`);
    const events = sortEventsChronologically(day.events);
    if (events.length === 0) {
      lines.push("    (no events scheduled)");
    }
    for (const e of events) {
      const time = e.startTime ? `${e.startTime} ` : "";
      lines.push(`    - [Event ID: ${e.id}] ${time}[${e.category}] ${e.title} ${e.locationName ? `(@ ${e.locationName})` : ""}`);
    }
  }

  lines.push("");
  lines.push("SAVED PLACES (MUST prioritize these when planning!):");
  if (trip.savedPlaces.length === 0) {
    lines.push("  (No saved places)");
  } else {
    for (const p of trip.savedPlaces) {
      // Check if it's already in the itinerary
      const inPlan = trip.days.some(d => d.events.some(e => e.placeId === p.placeId || e.title === p.name));
      const tag = inPlan ? "ALREADY IN ITINERARY" : "AVAILABLE TO BE SCHEDULED";
      lines.push(`  - [Saved Place ID: ${p.id}] [${tag}] ${p.name} (${p.category || "General"}) ${p.address ? `- ${p.address}` : ""}`);
    }
  }

  return { contextText: lines.join("\n"), trip };
}

const TOOLS = [{
  functionDeclarations: [
    {
      name: "search_places",
      description: "Search Google Maps for places to get their details (address, coordinates, placeId). Use this to find specific venues before adding them.",
      parameters: {
        type: "OBJECT",
        properties: { query: { type: "STRING", description: "Search query, e.g. 'Eiffel Tower', 'best pizza in Rome'" } },
        required: ["query"]
      }
    },
    {
      name: "add_event",
      description: "Add an event or place to a specific day in the itinerary.",
      parameters: {
        type: "OBJECT",
        properties: {
          dayId: { type: "STRING", description: "The ID of the day to add the event to" },
          title: { type: "STRING", description: "Name of the event or place" },
          category: { type: "STRING", description: "Category: ATTRACTION, FOOD, ACTIVITY, HOTEL, FLIGHT, TRANSPORTATION, or OTHER" },
          startTime: { type: "STRING", description: "Time in HH:MM format, e.g. '09:00'. Optional." },
          locationName: { type: "STRING", description: "CRITICAL: You MUST provide locationName if this is a physical place so the user gets Waze/Maps navigation links (e.g. 'Zucker's Bagels')." },
          address: { type: "STRING", description: "Address of the place." },
          lat: { type: "NUMBER", description: "Latitude of the place (from search_places)." },
          lng: { type: "NUMBER", description: "Longitude of the place (from search_places)." },
          placeId: { type: "STRING" },
          description: { type: "STRING", description: "Optional notes for the user" },
          savedPlaceId: { type: "STRING", description: "If you are adding a place from SAVED PLACES, provide its ID here to link it." }
        },
        required: ["dayId", "title", "category"]
      }
    },
    {
      name: "remove_event",
      description: "Remove an event from the itinerary by its Event ID.",
      parameters: {
        type: "OBJECT",
        properties: { eventId: { type: "STRING" } },
        required: ["eventId"]
      }
    },
    {
      name: "update_event",
      description: "Update details of an existing event by its Event ID.",
      parameters: {
        type: "OBJECT",
        properties: {
          eventId: { type: "STRING" },
          startTime: { type: "STRING" },
          title: { type: "STRING" },
          description: { type: "STRING" }
        },
        required: ["eventId"]
      }
    }
  ]
}];

const PLANNER_PROMPT = `You are "המתכנן", an expert AI Travel Planner.
You chat with the user in Hebrew. 
Your goal is to help the user plan their itinerary.
You have access to the current trip state, including days and SAVED PLACES.

CRITICAL RULES:
1. If the user asks to plan a full trip from scratch, you MUST prioritize and use ALL "AVAILABLE TO BE SCHEDULED" SAVED PLACES. Group them logically by region/day. You can search for new places to fill the gaps.
2. If the user asks for help with a SPECIFIC DAY ONLY, you should NOT automatically add saved places without asking. Instead, suggest relevant saved places for that day and ask for permission before adding them.
3. If the user agrees or asks you to add something, USE YOUR TOOLS to make the changes (add_event, remove_event, etc.).
4. Do not list raw IDs to the user. Keep the conversation natural.
5. If you need to find a place that is not in the saved places, use the search_places tool first to get its exact details (placeId, coordinates), then use add_event.
6. When you call a tool, I will execute it and return the result. Once you have finished all tool calls, reply to the user summarizing what you did in Hebrew.`;

export async function runPlannerChat(tripId: string, messages: { role: string; content: string }[]) {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) throw new Error("GOOGLE_GEMINI_API_KEY is not set.");

  let { contextText, trip } = await buildPlannerTripContext(tripId);
  
  const systemInstruction = {
    role: "user",
    parts: [{ text: `SYSTEM INSTRUCTIONS:\n${PLANNER_PROMPT}\n\nCURRENT TRIP STATE:\n${contextText}` }]
  };

  // Convert messages to Gemini format
  let geminiMessages = [systemInstruction];
  for (const m of messages) {
    geminiMessages.push({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    });
  }

  const locationBias = trip.mapCenterLat && trip.mapCenterLng ? { lat: trip.mapCenterLat, lng: trip.mapCenterLng } : undefined;

  let currentLoop = 0;
  const MAX_LOOPS = 25; // prevent infinite loops but allow large itineraries

  while (currentLoop < MAX_LOOPS) {
    currentLoop++;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: geminiMessages,
        tools: TOOLS,
        generationConfig: { temperature: 0.2 }
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini Planner Error:", err);
      throw new Error(`AI Request failed: ${res.statusText}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    if (!candidate) throw new Error("No response from AI.");

    const parts = candidate.content?.parts || [];
    const functionCalls = parts.filter((p: any) => p.functionCall);
    const textPart = parts.find((p: any) => p.text);

    // If there are no function calls, the AI is done, return the text response
    if (functionCalls.length === 0 && textPart) {
      return textPart.text;
    }

    // Append AI's response (with function calls) to history
    geminiMessages.push(candidate.content);

    const functionResponses: any[] = [];

    // Execute each function call
    for (const callWrapper of functionCalls) {
      const call = callWrapper.functionCall;
      const name = call.name;
      const args = call.args;
      console.log(`Planner calling tool: ${name}`, args);

      let result: any = { success: true };

      try {
        if (name === "search_places") {
          const places = await searchPlaces(args.query, locationBias);
          result = { places };
        } 
        else if (name === "add_event") {
          const maxOrder = await prisma.event.aggregate({
            where: { dayId: args.dayId },
            _max: { orderIndex: true }
          });
          const nextOrder = (maxOrder._max.orderIndex ?? 0) + 1;
          
          const event = await prisma.event.create({
            data: {
              dayId: args.dayId,
              title: args.title,
              category: args.category,
              startTime: args.startTime || null,
              locationName: args.locationName || null,
              address: args.address || null,
              lat: args.lat || null,
              lng: args.lng || null,
              placeId: args.placeId || null,
              description: args.description || null,
              orderIndex: nextOrder,
            }
          });
          
          if (args.savedPlaceId) {
            await prisma.savedPlace.update({
              where: { id: args.savedPlaceId },
              data: { assignedDayId: args.dayId }
            }).catch(() => {});
          }
          result = { eventId: event.id, status: "Created" };
        } 
        else if (name === "remove_event") {
          await prisma.event.delete({ where: { id: args.eventId } });
          result = { status: "Deleted" };
        } 
        else if (name === "update_event") {
          await prisma.event.update({
            where: { id: args.eventId },
            data: {
              startTime: args.startTime,
              title: args.title,
              description: args.description
            }
          });
          result = { status: "Updated" };
        }
      } catch (err: any) {
        console.error(`Error executing tool ${name}:`, err.message);
        result = { success: false, error: err.message };
      }

      functionResponses.push({
        functionResponse: {
          name: name,
          response: result
        }
      });
    }

    // Append function responses to history and continue loop
    geminiMessages.push({
      role: "user",
      parts: functionResponses
    });
  }

  return "I'm sorry, I encountered an internal error while trying to process the plan.";
}
