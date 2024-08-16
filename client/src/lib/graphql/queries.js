import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  createHttpLink,
  gql,
  concat,
} from "@apollo/client";
import { getAccessToken } from "../auth";

const httpLink = createHttpLink({ uri: "http://localhost:9000/graphql" });

const authLink = new ApolloLink((operation, forward) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    operation.setContext({
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }
  return forward(operation);
});
export const apolloClient = new ApolloClient({
  link: concat(authLink, httpLink),
  cache: new InMemoryCache(),
});

const jobDetailFragment = gql`
  fragment JobDetail on Job {
    id
    date
    title
    company {
      id
      name
    }
    description
  }
`;

export const createJobMutation = gql`
  mutation CreateJob($input: CreateJobInput!) {
    job: createJob(input: $input) {
      ...JobDetail
    }
  }
  ${jobDetailFragment}
`;

// @no longer need this code as we are using useMutation hook
export async function createJob({ title, description }) {
  // we have create a job alias in the mutation to help us handle response in the front end
  const mutation = gql`
    mutation CreateJob($input: CreateJobInput!) {
      job: createJob(input: $input) {
        ...JobDetail
      }
    }
    ${jobDetailFragment}
  `;

  // We could set the token on the authorization header here with the request headers
  const { data } = await apolloClient.mutate({
    mutation,
    variables: {
      input: { title, description },
    },
    // function called when we get the response
    // wreiting the data returned from the mutation directly into the cache
    // as if it was returned by the jobByIdQuery
    update: (cache, { data }) => {
      cache.writeQuery({
        query: jobByIdQuery,
        variables: {
          id: data.job.id,
        },
        data,
      });
    },
  });

  return data.job;
}

export const companyByIdQuery = gql`
  query CompanyById($id: ID!) {
    company(id: $id) {
      id
      name
      description
      jobs {
        id
        title
        date
        description
      }
    }
  }
`;

// we no longer need this function because we are using useQuery
// however this is useful in other frameworks
export async function getCompany(id) {
  const { data } = await apolloClient.query({
    query: companyByIdQuery,
    variables: { id },
  });

  return data.company;
}

export const jobByIdQuery = gql`
  query JobById($id: ID!) {
    job(id: $id) {
      ...JobDetail
    }
  }

  ${jobDetailFragment}
`;

export async function getJob(id) {
  const { data } = await apolloClient.query({
    query: jobByIdQuery,
    variables: { id },
  });

  return data.job;
}

export const jobsQuery = gql`
  query Jobs($limit: Int, $offset: Int) {
    jobs(limit: $limit, offset: $offset) {
      items {
        id
        title
        description
        date
        company {
          name
          id
          description
        }
      }
      totalCount
    }
  }
`;

export async function getJobs() {
  // default policy is cache first
  // network only ensures fresh data
  const { data } = await apolloClient.query({
    query: jobsQuery,
    fetchPolicy: "network-only",
  });

  return data.jobs;
}
