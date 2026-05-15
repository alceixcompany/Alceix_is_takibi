import {
  endOfDay,
  endOfMonth,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";

import { CALL_TARGET_PER_DAY, FIRM_STATUS_OPTIONS, PRODUCT_OPTIONS } from "@/lib/constants";
import type {
  Activity,
  AppUser,
  CommissionSummary,
  CrmDataset,
  Firm,
  ProductionTask,
  Sale,
} from "@/lib/types";

const BASE_COMMISSION = 500;
const EXTRA_COMMISSION = 500;

export function isPaidSale(sale: Sale) {
  return sale.payment_status === "paid";
}

export function isCurrentMonth(dateValue: string, now = new Date()) {
  const date = parseISO(dateValue);

  return isWithinInterval(date, {
    start: startOfMonth(now),
    end: endOfMonth(now),
  });
}

export function filterMonthlyPaidSales(sales: Sale[], userId: string, now = new Date()) {
  return sales.filter(
    (sale) => sale.user_id === userId && isPaidSale(sale) && isCurrentMonth(sale.created_at, now),
  );
}

export function countsTowardTarget(user: AppUser, sale: Sale) {
  if (!isPaidSale(sale)) {
    return false;
  }

  if (sale.user_id !== user.id) {
    return false;
  }

  if (user.target_product_type) {
    return sale.product_type === user.target_product_type;
  }

  return true;
}

export function calculateCommissionSummary(
  user: AppUser,
  sales: Sale[],
  now = new Date(),
): CommissionSummary {
  const paidSales = filterMonthlyPaidSales(sales, user.id, now);
  const targetQualifiedSales = paidSales.filter((sale) => countsTowardTarget(user, sale));
  const revenue = paidSales.reduce((sum, sale) => sum + sale.amount, 0);
  const confirmedSales = paidSales.length;
  const targetCount = targetQualifiedSales.length;
  const extraSaleCount =
    user.monthly_target > 0 ? Math.max(targetCount - user.monthly_target, 0) : 0;
  const baseCommission = confirmedSales * BASE_COMMISSION;
  const extraCommission = extraSaleCount * EXTRA_COMMISSION;
  const progressRatio =
    user.monthly_target > 0 ? Math.min(targetCount / user.monthly_target, 1) : 0;

  return {
    confirmedSales,
    targetQualifiedSales: targetCount,
    revenue,
    baseCommission,
    extraCommission,
    totalCommission: baseCommission + extraCommission,
    progressRatio,
  };
}

export function getCallCountToday(activities: Activity[], userId?: string, now = new Date()) {
  return activities.filter((activity) => {
    if (activity.type !== "call") {
      return false;
    }

    if (userId && activity.user_id !== userId) {
      return false;
    }

    return isSameDay(parseISO(activity.created_at), now);
  }).length;
}

export function filterFirms(
  firms: Firm[],
  filters: {
    query?: string;
    status?: string;
    assignedTo?: string;
  },
) {
  const query = filters.query?.trim().toLocaleLowerCase("tr-TR");

  return firms.filter((firm) => {
    const matchesQuery =
      !query ||
      [firm.company_name, firm.city, firm.district, firm.phone, firm.website, firm.instagram]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase("tr-TR").includes(query));

    const matchesStatus = !filters.status || firm.status === filters.status;
    const matchesAssignee = !filters.assignedTo || firm.assigned_to === filters.assignedTo;

    return matchesQuery && matchesStatus && matchesAssignee;
  });
}

export function filterDatasetForReports(
  dataset: CrmDataset,
  filters: {
    dateFrom?: string;
    dateTo?: string;
    salesUserId?: string;
    serviceType?: string;
    firmStatus?: string;
    paymentStatus?: string;
  },
) {
  const dateFrom = filters.dateFrom ? startOfDay(parseISO(filters.dateFrom)) : null;
  const dateTo = filters.dateTo ? endOfDay(parseISO(filters.dateTo)) : null;
  const isInRange = (dateValue: string) => {
    const date = parseISO(dateValue);

    if (dateFrom && date < dateFrom) return false;
    if (dateTo && date > dateTo) return false;

    return true;
  };

  const firms = dataset.firms.filter((firm) => {
    const matchesSalesUser = !filters.salesUserId || firm.assigned_to === filters.salesUserId;
    const matchesStatus = !filters.firmStatus || firm.status === filters.firmStatus;

    return matchesSalesUser && matchesStatus;
  });
  const firmIds = new Set(firms.map((firm) => firm.id));
  const sales = dataset.sales.filter((sale) => {
    const matchesFirm = firmIds.has(sale.firm_id);
    const matchesSalesUser = !filters.salesUserId || sale.user_id === filters.salesUserId;
    const matchesService = !filters.serviceType || sale.product_type === filters.serviceType;
    const matchesPayment = !filters.paymentStatus || sale.payment_status === filters.paymentStatus;
    const matchesDate = isInRange(sale.created_at);

    return matchesFirm && matchesSalesUser && matchesService && matchesPayment && matchesDate;
  });
  const saleFirmIds = new Set(sales.map((sale) => sale.firm_id));
  const reportFirmIds = filters.serviceType || filters.paymentStatus ? saleFirmIds : firmIds;

  return {
    users: dataset.users,
    firms: firms.filter((firm) => reportFirmIds.has(firm.id)),
    activities: dataset.activities.filter(
      (activity) => reportFirmIds.has(activity.firm_id) && isInRange(activity.created_at),
    ),
    sales,
    productionTasks: dataset.productionTasks.filter((task) => reportFirmIds.has(task.firm_id)),
    messages: dataset.messages ?? [],
  };
}

export function buildCommissionRows(users: AppUser[], sales: Sale[], now = new Date()) {
  return users
    .filter((user) => user.active)
    .map((user) => ({
      user,
      summary: calculateCommissionSummary(user, sales, now),
    }))
    .sort((a, b) => b.summary.totalCommission - a.summary.totalCommission);
}

export function getSalesPerformanceStats(dataset: CrmDataset, now = new Date()) {
  return dataset.users
    .filter((user) => user.role.includes("sales") || user.role.includes("admin"))
    .map((user) => {
      const assignedFirms = dataset.firms.filter((firm) => firm.assigned_to === user.id);
      const assignedFirmIds = new Set(assignedFirms.map((firm) => firm.id));
      const userCallActivities = dataset.activities.filter(
        (activity) =>
          activity.user_id === user.id &&
          (activity.type === "call" || activity.type === "status_change"),
      );
      const calledFirmIds = new Set(
        userCallActivities
          .filter((activity) => assignedFirmIds.has(activity.firm_id))
          .map((activity) => activity.firm_id),
      );
      const paidSales = dataset.sales.filter(
        (sale) => sale.user_id === user.id && sale.payment_status === "paid",
      );
      const commission = calculateCommissionSummary(user, dataset.sales, now);
      const attemptCount = userCallActivities.length;
      const reachedStatusCount = assignedFirms.filter((firm) =>
        ["arandi", "ilgilendi", "teklif_verildi", "odeme_bekleniyor", "odeme_alindi", "uretime_aktarildi", "teslim_edildi"].includes(
          firm.status,
        ),
      ).length;
      const unreachableCount = assignedFirms.filter((firm) => firm.status === "ulasilamadi").length;

      return {
        user,
        assignedCustomers: assignedFirms.length,
        todayCalls: getCallCountToday(dataset.activities, user.id, now),
        totalCalledCustomers: calledFirmIds.size,
        unreachableCustomers: unreachableCount,
        interestedCustomers: assignedFirms.filter((firm) => firm.status === "ilgilendi").length,
        uninterestedCustomers: assignedFirms.filter((firm) => firm.status === "ilgilenmedi").length,
        whatsappCustomers: assignedFirms.filter((firm) => firm.status === "whatsapp_atildi").length,
        offeredCustomers: assignedFirms.filter((firm) => firm.status === "teklif_verildi").length,
        paymentPendingCustomers: assignedFirms.filter((firm) => firm.status === "odeme_bekleniyor").length,
        paymentReceivedCustomers: assignedFirms.filter((firm) =>
          ["odeme_alindi", "uretime_aktarildi", "teslim_edildi"].includes(firm.status),
        ).length,
        convertedCustomers: paidSales.length,
        revenue: paidSales.reduce((sum, sale) => sum + sale.amount, 0),
        commission: commission.totalCommission,
        conversionRate: calledFirmIds.size ? paidSales.length / calledFirmIds.size : 0,
        reachRate: attemptCount ? reachedStatusCount / attemptCount : 0,
        unreachableRate: attemptCount ? unreachableCount / attemptCount : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export function getTeamPerformanceStats(dataset: CrmDataset, now = new Date()) {
  const salesStats = getSalesPerformanceStats(dataset, now);

  return dataset.users.map((user) => {
    const sales = salesStats.find((row) => row.user.id === user.id);
    const taskCounts = buildEmployeeTaskCounts(user, dataset.productionTasks, now);

    return {
      user,
      sales,
      tasks: taskCounts,
    };
  });
}

export function getServiceReportRows(dataset: CrmDataset) {
  return PRODUCT_OPTIONS.map((product) => {
    const sales = dataset.sales.filter((sale) => sale.product_type === product.value);
    const paidSales = sales.filter((sale) => sale.payment_status === "paid");
    const pendingSales = sales.filter((sale) => sale.payment_status === "pending");
    const revenue = sales.reduce((sum, sale) => sum + sale.amount, 0);

    return {
      service: product,
      salesCount: sales.length,
      revenue,
      averageSaleAmount: sales.length ? revenue / sales.length : 0,
      pendingAmount: pendingSales.reduce((sum, sale) => sum + sale.amount, 0),
      paidAmount: paidSales.reduce((sum, sale) => sum + sale.amount, 0),
    };
  }).filter((row) => row.salesCount > 0);
}

export function getFirmStatusReportRows(dataset: CrmDataset) {
  const total = dataset.firms.length;

  return FIRM_STATUS_OPTIONS.map((status) => {
    const count = dataset.firms.filter((firm) => firm.status === status.value).length;

    return {
      status,
      count,
      ratio: total ? count / total : 0,
    };
  });
}

export function getProductionReportRows(dataset: CrmDataset, now = new Date()) {
  return dataset.users
    .map((user) => {
      const tasks = dataset.productionTasks.filter((task) => task.assigned_to === user.id);

      return {
        user,
        assigned: tasks.length,
        inProgress: tasks.filter((task) => task.status === "in_progress").length,
        revision: tasks.filter((task) => task.status === "revision").length,
        waitingClient: tasks.filter((task) => task.status === "waiting_client").length,
        done: tasks.filter((task) => task.status === "done").length,
        overdue: getOverdueTasks(tasks, now).length,
      };
    })
    .filter((row) => row.assigned > 0);
}

export function getReportSummary(dataset: CrmDataset, now = new Date()) {
  const salesStats = getSalesPerformanceStats(dataset, now);
  const activeTasks = dataset.productionTasks.filter((task) =>
    ["todo", "in_progress", "waiting_client", "revision", "ready_to_deliver"].includes(task.status),
  );

  return {
    totalCustomers: dataset.firms.length,
    totalCalledCustomers: new Set(
      dataset.activities
        .filter((activity) => activity.type === "call")
        .map((activity) => activity.firm_id),
    ).size,
    totalUnreachable: dataset.firms.filter((firm) => firm.status === "ulasilamadi").length,
    totalInterested: dataset.firms.filter((firm) => firm.status === "ilgilendi").length,
    totalOffered: dataset.firms.filter((firm) => firm.status === "teklif_verildi").length,
    totalPaymentPending: dataset.firms.filter((firm) => firm.status === "odeme_bekleniyor").length,
    totalPaymentReceived: dataset.firms.filter((firm) =>
      ["odeme_alindi", "uretime_aktarildi", "teslim_edildi"].includes(firm.status),
    ).length,
    revenue: dataset.sales
      .filter((sale) => sale.payment_status === "paid")
      .reduce((sum, sale) => sum + sale.amount, 0),
    commission: salesStats.reduce((sum, row) => sum + row.commission, 0),
    activeTasks: activeTasks.length,
    overdueTasks: getOverdueTasks(dataset.productionTasks, now).length,
    completedTasks: dataset.productionTasks.filter((task) => task.status === "done").length,
  };
}

export function buildAdminMetrics(dataset: CrmDataset, now = new Date()) {
  const todayCalls = getCallCountToday(dataset.activities, undefined, now);
  const interestedFirmCount = dataset.firms.filter((firm) =>
    ["ilgilendi", "odeme_bekleniyor", "odeme_alindi"].includes(firm.status),
  ).length;
  const paymentPendingCount = dataset.firms.filter(
    (firm) => firm.status === "odeme_bekleniyor",
  ).length;
  const paymentReceivedCount = dataset.firms.filter(
    (firm) => firm.status === "odeme_alindi" || firm.status === "teslim_edildi",
  ).length;
  const revenue = dataset.sales
    .filter((sale) => isPaidSale(sale))
    .reduce((sum, sale) => sum + sale.amount, 0);
  const commissionRows = buildCommissionRows(dataset.users, dataset.sales, now);
  const totalCommission = commissionRows.reduce(
    (sum, row) => sum + row.summary.totalCommission,
    0,
  );
  const callsByPerson = dataset.users.map((user) => ({
    user,
    count: getCallCountToday(dataset.activities, user.id, now),
  }));
  const activeTasks = dataset.productionTasks.filter((task) =>
    ["todo", "in_progress", "waiting_client", "revision", "ready_to_deliver"].includes(task.status),
  );
  const overdueTasks = getOverdueTasks(dataset.productionTasks, now);
  const taskDistribution = dataset.users.map((user) => ({
    user,
    count: activeTasks.filter((task) => task.assigned_to === user.id).length,
  }));

  return {
    totalFirms: dataset.firms.length,
    todayCalls,
    callsByPerson,
    interestedFirmCount,
    paymentPendingCount,
    paymentReceivedCount,
    revenue,
    totalCommission,
    commissionRows,
    activeTasks: activeTasks.length,
    overdueTasks: overdueTasks.length,
    taskDistribution,
  };
}

export function buildSalesMetrics(user: AppUser, dataset: CrmDataset, now = new Date()) {
  const myFirms = dataset.firms.filter((firm) => firm.assigned_to === user.id);
  const myCalls = getCallCountToday(dataset.activities, user.id, now);
  const mySales = dataset.sales.filter((sale) => sale.user_id === user.id);
  const myPaidSales = mySales.filter((sale) => isPaidSale(sale));
  const commission = calculateCommissionSummary(user, dataset.sales, now);

  return {
    assignedFirms: myFirms.length,
    todayTarget: CALL_TARGET_PER_DAY,
    todayCalls: myCalls,
    interestedFirms: myFirms.filter((firm) => firm.status === "ilgilendi").length,
    paymentPending: myFirms.filter((firm) => firm.status === "odeme_bekleniyor").length,
    closedSales: myPaidSales.length,
    paidSales: myPaidSales.length,
    revenue: myPaidSales.reduce((sum, sale) => sum + sale.amount, 0),
    conversionRate: myFirms.length ? myPaidSales.length / myFirms.length : 0,
    commission,
  };
}

export function getOverdueTasks(tasks: ProductionTask[], now = new Date()) {
  return tasks.filter((task) => {
    if (!task.due_date || ["done", "cancelled"].includes(task.status)) {
      return false;
    }

    return parseISO(task.due_date).getTime() < now.getTime();
  });
}

export function buildProductionMetrics(tasks: ProductionTask[], now = new Date()) {
  return {
    pending: tasks.filter((task) => task.status === "todo").length,
    inProgress: tasks.filter((task) => task.status === "in_progress").length,
    readyToDeliver: tasks.filter((task) => task.status === "ready_to_deliver").length,
    delivered: tasks.filter((task) => task.status === "done").length,
    overdue: getOverdueTasks(tasks, now).length,
  };
}

export function buildEmployeeTaskCounts(user: AppUser, tasks: ProductionTask[], now = new Date()) {
  const assigned = tasks.filter((task) => task.assigned_to === user.id);

  return {
    total: assigned.length,
    active: assigned.filter((task) =>
      ["todo", "in_progress", "waiting_client", "revision", "ready_to_deliver"].includes(task.status),
    ).length,
    done: assigned.filter((task) => task.status === "done").length,
    overdue: getOverdueTasks(assigned, now).length,
  };
}
