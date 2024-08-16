import { useParams } from "react-router";
import { useCompany } from "../lib/graphql/hooks";
import JobList from "../components/JobList";

function CompanyPage() {
  const { companyId } = useParams();
  const { company, loading, error } = useCompany(companyId);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <div className="has-text-danger">Data unavailable</div>;
  }

  return (
    <div>
      <h1 className="title">{company.name}</h1>
      <div className="box">{company.description}</div>
      <h2 className="title is-5">jobs at {company.name}</h2>
      <JobList jobs={company.jobs} />
    </div>
  );
}

export default CompanyPage;
