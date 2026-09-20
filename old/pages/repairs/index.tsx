import Link from "next/link";
import { useEffect, useState } from "react";
import RepairList from "../../components/car/repair/RepairList";
import SimplePageWrapper from "../../components/SimplePageWrapper";
import Button from "../../components/utilities/form/Button";
import Spinner from "../../components/utilities/helper/Spinner";
import Stack from "../../components/utilities/helper/Stack";
import { Col } from "../../components/utilities/layout/Container";
import useRepairsBackend, { RepairBackendError } from "../../hooks/fetch/use-repairs-backend";
import useAuth from "../../hooks/use-auth";
import useToast from "../../hooks/use-toast";
import { FrontendRepair } from "../../lib/types/car";
import { ToastData } from "../../lib/frontend/toastData";

export default function Home() {
  useAuth({ redirectTo: "/auth/login" });
  const addToast = useToast();
  const [loaded, setLoaded] = useState(false);

  const { getAllRepairs } = useRepairsBackend();
  const [repairList, setRepairList] = useState<FrontendRepair[]>([]);

  const fetchAllRefuels = () => {
    setLoaded(false);
    getAllRepairs()
      .then((list) => {
        setRepairList(list);
      })
      .catch((err) => {
        if (!(err instanceof RepairBackendError)) {
          console.error(err);
          addToast(new ToastData("Load repairs", "Error while loading.", "danger", false));
        }
      })
      .finally(() => {
        setLoaded(true);
      });
  };

  useEffect(() => {
    fetchAllRefuels();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SimplePageWrapper title="Repairs">
      <Col className="col-12 col-lg-10 mt-3">
        <Stack>
          <Link className="ms-auto" href="/repairs/create">
            <Button btnClass="success">Add new repair</Button>
          </Link>
        </Stack>
        <h3>List of repairs:</h3>
        {!loaded && (
          <div className="text-center">
            <Spinner />
          </div>
        )}
        {loaded && <RepairList repairList={repairList} />}
      </Col>
    </SimplePageWrapper>
  );
}
