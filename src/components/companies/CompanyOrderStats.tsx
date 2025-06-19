
import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ShoppingCart, TrendingUp, Clock } from "lucide-react";

interface CompanyOrderStatsProps {
  totalCompanies: number;
  totalOrders: number;
  recentSyncs: number;
}

const CompanyOrderStats: React.FC<CompanyOrderStatsProps> = ({
  totalCompanies,
  totalOrders,
  recentSyncs
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <Building2 className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-sm text-muted-foreground">Total Companies</p>
            <p className="text-2xl font-bold">{totalCompanies}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          <div>
            <p className="text-sm text-muted-foreground">Recent Syncs</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold">{recentSyncs}</p>
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Auto
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CompanyOrderStats;
