import { Dashboard } from "../components/Dashboard/Dashboard";
import { useDashboardState } from "../state/useDashboardState";
import type { AnyTileConfig } from "../tiles/registry";

const defaultTiles: AnyTileConfig[] = [
  {
    id: "clock-1",
    type: "clock",
    title: "Local Time",
    props: {
      timeZone: "America/New_York",
    },
  },
  {
    id: "link-1",
    type: "link",
    title: "Skyss",
    props: {
      url: "https://avgangsvisning.skyss.no/view/#/?stops=NSR:StopPlace:31377%7CNSR:Quay:54027,NSR:StopPlace:31377%7CNSR:Quay:54028&viewFreq=10000&type=TERMINAL&colors=darkhttps://react.dev",
    },
  },
];

export default function Home() {
  const { tiles, setTiles } = useDashboardState(defaultTiles);

  return <Dashboard tiles={tiles} />;
}
