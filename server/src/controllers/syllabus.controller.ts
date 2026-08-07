import { Response } from "express";
import { prisma } from "../config/db.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

export const getSyllabusFiles = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const files = await prisma.syllabusFile.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        name: true,
        subject: true,
        uploadedAt: true,
        modules: {
          select: {
            id: true,
            name: true,
            estimatedHours: true,
          },
        },
      },
      orderBy: { uploadedAt: "desc" },
    });

    const filesWithUrls = files.map((file) => ({
      ...file,
      url: `/api/syllabus/${file.id}/download`,
    }));

    return sendSuccess(res, filesWithUrls);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to load syllabus files", 500);
  }
};

export const uploadSyllabusFile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const { subject, name } = req.body;
    const file = req.file;

    if (!file) {
      return sendError(res, "PDF file upload required", 400);
    }

    if (!subject || !name) {
      return sendError(res, "Subject and display name are required", 400);
    }

    const syllabusFile = await prisma.syllabusFile.create({
      data: {
        name,
        subject,
        fileData: file.buffer,
        userId: req.user.id,
      },
      select: {
        id: true,
        name: true,
        subject: true,
        uploadedAt: true,
      },
    });

    return sendSuccess(res, {
      ...syllabusFile,
      url: `/api/syllabus/${syllabusFile.id}/download`,
      modules: [],
    }, 201);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to upload syllabus file", 500);
  }
};

export const downloadSyllabusFile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const file = await prisma.syllabusFile.findUnique({
      where: { id },
    });

    if (!file) {
      return res.status(404).send("File not found");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.name)}"`);
    return res.send(file.fileData);
  } catch (error: any) {
    return res.status(500).send(error.message || "Download failed");
  }
};

export const deleteSyllabusFile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const { id } = req.params;

    const existingFile = await prisma.syllabusFile.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existingFile) {
      return sendError(res, "Syllabus file not found or unauthorized", 404);
    }

    await prisma.syllabusFile.delete({
      where: { id },
    });

    return sendSuccess(res, { id });
  } catch (error: any) {
    return sendError(res, error.message || "Failed to delete syllabus file", 500);
  }
};

export const addModule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const { id: syllabusFileId } = req.params;
    const { name, estimatedHours } = req.body;

    if (!name) {
      return sendError(res, "Module name is required", 400);
    }

    const file = await prisma.syllabusFile.findFirst({
      where: { id: syllabusFileId, userId: req.user.id },
    });

    if (!file) {
      return sendError(res, "Syllabus file not found or unauthorized", 404);
    }

    const module = await prisma.subjectModule.create({
      data: {
        name,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        syllabusFileId,
      },
    });

    return sendSuccess(res, module, 201);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to add module", 500);
  }
};

export const removeModule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const { id: syllabusFileId, moduleId } = req.params;

    const file = await prisma.syllabusFile.findFirst({
      where: { id: syllabusFileId, userId: req.user.id },
    });

    if (!file) {
      return sendError(res, "Syllabus file not found or unauthorized", 404);
    }

    const module = await prisma.subjectModule.findFirst({
      where: { id: moduleId, syllabusFileId },
    });

    if (!module) {
      return sendError(res, "Module not found", 404);
    }

    await prisma.subjectModule.delete({
      where: { id: moduleId },
    });

    return sendSuccess(res, { id: moduleId });
  } catch (error: any) {
    return sendError(res, error.message || "Failed to remove module", 500);
  }
};
