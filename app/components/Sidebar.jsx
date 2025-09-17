"use client"; // Enables client-side interactivity

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from "../hooks/useTranslation";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../components/ui/collapsible";
import {
  Home,
  FileText,
  Calendar,
  History,
  Users,
  Settings,
  Shield,
  Package,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ activeTopLink, activeLink, setActiveLink, isMobile, onNavigate }) {
  const [isReportsMenuOpen, setIsReportsMenuOpen] = useState(false);
  const { user, isAdmin, isOMStaff } = useAuth();
  const { t } = useTranslation();

  // Automatically expand Reports menu when on reports pages
  useEffect(() => {
    if (activeLink === "/reports" || activeLink === "/assignedReports") {
      setIsReportsMenuOpen(true);
    }
  }, [activeLink]);

  const handleLinkClick = (link) => {
    setActiveLink(link);
    // Close mobile sidebar when navigating
    if (isMobile && onNavigate) {
      onNavigate();
    }
  };

  const renderLinks = () => {
    // OM Staff - Show both Unassigned and Assigned Reports
    if (isOMStaff()) {
      return (
        <div className="space-y-1">
          {/* Reports Menu */}
          <Collapsible
            open={isReportsMenuOpen}
            onOpenChange={setIsReportsMenuOpen}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start"
              >
                <FileText className="mr-2 h-4 w-4" />
                <span className="ml-0.4">{t('sidebar.reports')}</span>
                {isReportsMenuOpen ? (
                  <ChevronDown className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronRight className="ml-auto h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 ml-9 mt-1">
              <Button
                variant={activeLink === "/reports" ? "default" : "ghost"}
                className="w-full justify-start pl-6 dark:text-gray-200 dark:hover:text-white"
                asChild
              >
                <Link
                  href="/reports"
                  onClick={() => handleLinkClick("/reports")}
                >
                  {t('sidebar.unassignedReports')}
                </Link>
              </Button>
              <Button
                variant={activeLink === "/assignedReports" ? "default" : "ghost"}
                className="w-full justify-start pl-6 dark:text-gray-200 dark:hover:text-white"
                asChild
              >
                <Link
                  href="/assignedReports"
                  onClick={() => handleLinkClick("/assignedReports")}
                >
                  {t('sidebar.assignedReports')}
                </Link>
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </div>
      );
    }

    // Admin Navigation
    if (isAdmin()) {
      switch (activeTopLink) {
        case "/admins":
          return (
            <div className="space-y-1">
              <Button
                variant={activeLink === "/admins" ? "default" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link
                  href="/admins"
                  onClick={() => handleLinkClick("/admins")}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {t('sidebar.adminManagement')}
                </Link>
              </Button>
              <Button
                variant={activeLink === "/staff-management" ? "default" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link
                  href="/staff-management"
                  onClick={() => handleLinkClick("/staff-management")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {t('sidebar.staffManagement')}
                </Link>
              </Button>
            </div>
          );

        default:
          return (
            <div className="space-y-1">
              {/* Home */}
              <Button
                variant={activeLink === "/dashboard" || activeLink === "/" ? "default" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link
                  href="/dashboard"
                  onClick={() => handleLinkClick("/dashboard")}
                >
                  <Home className="mr-2 h-4 w-4" />
                  {t('sidebar.home')}
                </Link>
              </Button>

              {/* Reports */}
              <Collapsible
                open={isReportsMenuOpen}
                onOpenChange={setIsReportsMenuOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="ml-0.4">{t('sidebar.reports')}</span>
                    {isReportsMenuOpen ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 ml-9 mt-1">
                  <Button
                    variant={activeLink === "/reports" ? "default" : "ghost"}
                    className="w-full justify-start pl-6"
                    asChild
                  >
                    <Link
                      href="/reports"
                      onClick={() => handleLinkClick("/reports")}
                    >
                      {t('sidebar.allReports')}
                    </Link>
                  </Button>
                  <Button
                    variant={activeLink === "/assignedReports" ? "default" : "ghost"}
                    className="w-full justify-start pl-6"
                    asChild
                  >
                    <Link
                      href="/assignedReports"
                      onClick={() => handleLinkClick("/assignedReports")}
                    >
                      {t('sidebar.assignedReports')}
                    </Link>
                  </Button>
                </CollapsibleContent>
              </Collapsible>

              <Button
                variant={activeLink === "/daily-report" ? "default" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link
                  href="/daily-report"
                  onClick={() => handleLinkClick("/daily-report")}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {t('sidebar.dailyReports')}
                </Link>
              </Button>

              {/* Order Material */}
              <Button
                variant={activeLink === "/order-material" ? "default" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link
                  href="/order-material"
                  onClick={() => handleLinkClick("/order-material")}
                >
                  <Package className="mr-2 h-4 w-4" />
                  {t('sidebar.orderMaterial')}
                </Link>
              </Button>

              {/* History */}
              <Button
                variant={activeLink === "/history" ? "default" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link
                  href="/history"
                  onClick={() => handleLinkClick("/history")}
                >
                  <History className="mr-2 h-4 w-4" />
                  {t('sidebar.history')}
                </Link>
              </Button>
            </div>
          );
      }
    }

    // Fallback - no navigation
    return <div className="space-y-1"></div>;
  };

  return (
    <Card className={`p-4 overflow-y-auto ${
      isMobile 
        ? 'h-[calc(100vh-6rem)] w-full' 
        : 'w-full h-[calc(100vh-2rem)] sticky top-6'
    }`}>
      <nav className="space-y-2">
        {renderLinks()}
      </nav>
    </Card>
  );
}
