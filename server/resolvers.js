// The Resolvers and the schemas always need to match
import {
  getJobs,
  getJob,
  getJobsByCompany,
  createJob,
  deleteJob,
  updateJob,
  countJobs,
} from "./db/jobs.js";
import { getCompany } from "./db/companies.js";
import { GraphQLError } from "graphql";
export const resolvers = {
  Query: {
    company: async (_root, { id }) => {
      const company = await getCompany(id);

      if (!company) {
        throw notFoundError("No Company found with id: " + id);
      }
      return company;
    },
    job: async (_root, { id }) => {
      const job = await getJob(id);

      if (!job) {
        throw notFoundError("No Job found with id: " + id);
      }
      return job;
    },
    jobs: async (_root, { limit, offset }) => {
      const items = getJobs(limit, offset);
      const totalCount = await countJobs()
      return {
        items,
        totalCount,
      };
    },
  },

  Mutation: {
    createJob: (_root, { input: { title, description } }, { user }) => {
      if (!user) {
        throw unauthorizedError("Missing authentication");
      }
      return createJob({ companyId: user.companyId, title, description });
    },
    deleteJob: async (_root, { id }, { user }) => {
      if (!user) {
        throw unauthorizedError("Missing authentication");
      }
      const job = await deleteJob(id, user.companyId);

      if (!job) {
        throw notFoundError(
          "No Job found (as you can only delete jobs which belong to your company)"
        );
      }

      return job;
    },
    updateJob: async (
      _root,
      { input: { id, title, description } },
      { user }
    ) => {
      if (!user) {
        throw unauthorizedError("Missing authentication");
      }
      const job = await updateJob({ id, title, description }, user.companyId);

      if (!job) {
        throw notFoundError(
          "No Job found (as you can only delete jobs which belong to your company)"
        );
      }

      return job;
    },
  },

  // resolve field before returing to the client
  // This has allowed us to take the createdAt property
  // from the database and transform it into a date field
  Company: {
    jobs: (company) => getJobsByCompany(company.id),
  },
  Job: {
    date: (job) => toIsoDate(job.createdAt),
    company: (job, _args, { companyLoader }) => {
      return companyLoader.load(job.companyId);
    },
  },
};

function toIsoDate(value) {
  return value.slice(0, "yyyy-mm-dd".length);
}

// Extracting error code into custom function

function notFoundError(message) {
  return new GraphQLError(message, {
    extensions: { code: "NOT_FOUND" },
  });
}

function unauthorizedError(message) {
  return new GraphQLError(message, {
    extensions: { code: "UNAUTHORIZED" },
  });
}
