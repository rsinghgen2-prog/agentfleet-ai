import { Container, getContainer } from "@cloudflare/containers";

interface Env {
  PATIENT_CONTAINER: DurableObjectNamespace<PatientContainer>;
  HYPERDRIVE: Hyperdrive;
  NODE_ENV: string;
  PORT: string;
  CORS_ORIGIN: string;
  JWT_SECRET: string;
}

// Runtime env vars injected into the container instance. Populated by the Worker
// fetch handler below from the Hyperdrive binding + Worker secrets/vars.
let containerEnv: Record<string, string> = {};

export class PatientContainer extends Container<Env> {
  defaultPort = 3010;
  sleepAfter = "5m";

  // The Express app reads DATABASE_URL, JWT_SECRET, CORS_ORIGIN, PORT.
  get envVars() {
    return containerEnv;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Point the Express app's pg Pool at Hyperdrive's pooled connection string.
    containerEnv = {
      DATABASE_URL: env.HYPERDRIVE.connectionString,
      JWT_SECRET: env.JWT_SECRET,
      CORS_ORIGIN: env.CORS_ORIGIN,
      NODE_ENV: env.NODE_ENV,
      PORT: env.PORT,
    };

    // Single stateless service: route all requests to one container instance.
    const container = getContainer(env.PATIENT_CONTAINER, "patient-service");
    return container.fetch(request);
  },
};
