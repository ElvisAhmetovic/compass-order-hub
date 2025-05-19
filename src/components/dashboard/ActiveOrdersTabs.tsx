
import { Button } from "@/components/ui/button";

interface ActiveOrdersTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ActiveOrdersTabs = ({ activeTab, setActiveTab }: ActiveOrdersTabsProps) => {
  const tabs = ["All", "In Progress", "Complaint", "Invoice Sent"];

  return (
    <div className="flex border-b">
      {tabs.map((tab) => (
        <Button
          key={tab}
          variant="ghost"
          className={`rounded-none border-b-2 ${
            activeTab === tab
              ? "border-primary font-medium"
              : "border-transparent"
          }`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </Button>
      ))}
    </div>
  );
};

export default ActiveOrdersTabs;
