import React from "react";
import PageHeader from "./PageHeader";
import PageLayout from "./PageLayout";
import PageToolbar from "./PageToolbar";
import PageWorkflow from "./PageWorkflow";

export default function AppScreen({
  title,
  subtitle,
  icon,
  action,
  actionLabel,
  actionIcon,
  onAction,
  summaryItems = [],
  filters,
  toolbar,
  workflow,
  children,
  maxWidth = 1280,
  contentSx,
  headerSx,
  filterSx,
  layoutSx,
}) {
  const filterContent = filters ?? toolbar;

  return (
    <PageLayout
      maxWidth={maxWidth}
      sx={layoutSx}
      contentSx={contentSx}
    >
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        action={action}
        actionLabel={actionLabel}
        actionIcon={actionIcon}
        onAction={onAction}
        summaryItems={summaryItems}
        sx={{ mb: 0, ...headerSx }}
      />

      <PageToolbar sx={filterSx}>
        {filterContent}
      </PageToolbar>

      <PageWorkflow {...(workflow || {})} />

      {children}
    </PageLayout>
  );
}
