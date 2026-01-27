import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import express from "express";
import { departments, subjects } from "../db/schema";
import { db } from "../db";
const subjectsRouter = express.Router();

//get all subjs with optional search with filtering and pagination
subjectsRouter.get("/", async (req, res) => {
  try {
    const { search, department, page = 1, limit = 10 } = req.query;
    const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
    const limitPerPage = Math.min(
      Math.max(1, parseInt(String(limit), 10) || 10),
      100,
    ); //max 100 records per page
    const offset = (currentPage - 1) * limitPerPage;
    const filterCondition = [];
    if (search) {
      filterCondition.push(
        or(
          ilike(subjects.name, `%${search}%`),
          ilike(subjects.code, `%${search}%`),
        ),
      );
    }

    if (department) {
      // Escape SQL wildcard characters (% and _) to prevent pattern abuse
      const escapedDepartment = String(department).replace(/[%_]/g, "\\$&");

      // Wrap with % for partial matching
      const deptPattern = `%${escapedDepartment}%`;

      filterCondition.push(ilike(departments.name, deptPattern));
    }

    //Combining all filters
    const whereClause =
      filterCondition.length > 0 ? and(...filterCondition) : undefined;
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(subjects)
      .leftJoin(departments, eq(subjects.departmentId, departments.id))
      .where(whereClause);
    const totalCount = countResult[0]?.count ?? 0;

    const subjectsList = await db
      .select({
        ...getTableColumns(subjects),
        department: { ...getTableColumns(departments) },
      })
      .from(subjects)
      .leftJoin(departments, eq(subjects.departmentId, departments.id))
      .where(whereClause)
      .orderBy(desc(subjects.createdAt))
      .limit(limitPerPage)
      .offset(offset);

    res.status(200).json({
      data: subjectsList,
      page: currentPage,
      limit: limitPerPage,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limitPerPage),
    });
  } catch (error) {
    console.error(`GET/subjects error: ${error}`);
    res.status(500).json({ error: "Failed to get subjects" });
  }
});
export default subjectsRouter;
