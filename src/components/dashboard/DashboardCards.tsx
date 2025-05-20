
import { Card, CardContent } from "@/components/ui/card";
import { 
  ClipboardCheck, 
  FileText, 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
  Trash
} from "lucide-react";
import { OrderStatus } from "@/types";

interface OrderSummary {
  status: OrderStatus;
  count: number;
  value: number;
}

// Mock data for demonstration purposes
const orderSummaries: OrderSummary[] = [
  { status: "In Progress", count: 21, value: 1000 },
  { status: "Invoice Sent", count: 3, value: 500 },
  { status: "Invoice Paid", count: 1, value: 750 },
  { status: "Complaint", count: 0, value: 250 },
  { status: "Resolved", count: 1, value: 1250 },
  { status: "Cancelled", count: 2, value: 100 },
  { status: "Deleted", count: 5, value: 50 },
  { status: "Review", count: 1, value: 300 },
];

interface SummaryCardProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  value: number;
  colorClass?: string;
}

const SummaryCard = ({ 
  icon, 
  title, 
  count, 
  value,
  colorClass = "text-primary"
}: SummaryCardProps) => {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className={`${colorClass} mb-2`}>
            {icon}
          </div>
          <div>
            <h3 className="font-medium text-lg">{title}</h3>
            <div className="text-muted-foreground text-sm">
              {count} {count === 1 ? 'order' : 'orders'} — €{value}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const DashboardCards = () => {
  const getIcon = (status: OrderStatus) => {
    const iconProps = { className: "h-6 w-6" };
    
    switch (status) {
      case "In Progress":
        return <ClipboardCheck {...iconProps} />;
      case "Invoice Sent":
        return <FileText {...iconProps} />;
      case "Invoice Paid":
        return <CreditCard {...iconProps} />;
      case "Complaint":
        return <AlertCircle {...iconProps} />;
      case "Resolved":
        return <CheckCircle {...iconProps} />;
      case "Cancelled":
        return <XCircle {...iconProps} />;
      case "Deleted":
        return <Trash {...iconProps} />;
      case "Review":
        return <Star {...iconProps} />;
      default:
        return <ClipboardCheck {...iconProps} />;
    }
  };

  const getColorClass = (status: OrderStatus): string => {
    switch (status) {
      case "In Progress":
        return "text-blue-500";
      case "Invoice Sent":
        return "text-purple-500";
      case "Invoice Paid":
        return "text-green-500";
      case "Complaint":
        return "text-amber-500";
      case "Resolved":
        return "text-green-600";
      case "Cancelled":
        return "text-red-500";
      case "Deleted":
        return "text-gray-500";
      case "Review":
        return "text-indigo-500";
      default:
        return "text-primary";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {orderSummaries.map((summary) => (
        <SummaryCard
          key={summary.status}
          icon={getIcon(summary.status)}
          title={summary.status}
          count={summary.count}
          value={summary.value}
          colorClass={getColorClass(summary.status)}
        />
      ))}
    </div>
  );
};
