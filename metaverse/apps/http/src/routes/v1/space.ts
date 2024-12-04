import { Router } from "express";
import {
  AddElementSchema,
  CreateElementSchema,
  CreateSpaceSchema,
  DeleteElementSchema,
} from "../../types";
import client from "@repo/db/client";
import { userMiddleware } from "../../middleware/user";
export const spaceRouter = Router();

spaceRouter.post("/", userMiddleware, async (req, res) => {
  const parsedData = CreateSpaceSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: "Validation failed" });
    return;
  }
  if (!parsedData.data.mapId) {
    await client.space.create({
      data: {
        name: parsedData.data.name,
        width: parseInt(parsedData.data.dimensions.split("x")[0]),
        height: parseInt(parsedData.data.dimensions.split("x")[1]),
        creatorId: req.userId!,
      },
    });
    res.json({ message: "Space created successfully" });
  }
  const map = await client.map.findUnique({
    where: { id: parsedData.data.mapId },
    select: {
      mapElements: true,
    },
  });
  if (!map) {
    res.status(404).json({ message: "Map not found" });
    return;
  }
  await client.$transaction(async () => {
    const space = await client.space.create({
      data: {
        name: parsedData.data.name,
        width: parseInt(parsedData.data.dimensions.split("x")[0]),
        height: parseInt(parsedData.data.dimensions.split("x")[1]),
        creatorId: req.userId!,
      },
    });
    await client.spaceElements.createMany({
      data: map.mapElements.map((e) => ({
        spaceId: space.id,
        elementId: e.elementId,
        x: e.x!,
        y: e.y!,
      })),
    });

    return space;
  });
  res.json({ message: "Space created successfully" });
});

spaceRouter.delete("/:spaceId", async (req, res) => {
  const space = await client.space.findUnique({
    where: { id: req.params.spaceId },
    select: { creatorId: true },
  });
  if (!space) {
    res.status(400).json({ message: "Space not found" });
    return;
  }
  if (space?.creatorId == null || space.creatorId !== req.userId) {
    res.status(403).json({ message: "Unauthorized" });
    return;
  }
  await client.space.delete({ where: { id: req.params.spaceId } });
  res.json({ message: "Space deleted successfully" });
});

spaceRouter.get("/all", userMiddleware, async (req, res) => {
  const spaces = await client.space.findMany({
    where: { creatorId: req.userId },
  });
  res.json({
    spaces: spaces.map((s) => ({
      id: s.id,
      name: s.name,
      width: s.width,
      height: s.height,
    })),
  });
});
spaceRouter.post("/element", userMiddleware, async (req, res) => {
  const parsedData = AddElementSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: "Validation failed" });
    return;
  }
  const space = await client.space.findUnique({
    where: {
      id: parsedData.data.spaceId,
      creatorId: req.userId,
    },
    select: {
      width: true,
      height: true,
    },
  });
  if (!space) {
    res.status(403).json({ message: "Unauthorized" });
    return;
  }
  await client.spaceElements.create({
    data: {
      spaceId: parsedData.data.spaceId,
      elementId: parsedData.data.elementId,
      x: parsedData.data.x,
      y: parsedData.data.y,
    },
  });
  res.json({ message: "Element added successfully" });
});

spaceRouter.get("/:spaceId", async (req, res) => {
  const space = await client.space.findUnique({
    where: { id: req.params.spaceId },
    select: {
      width: true,
      height: true,
      creatorId: true,
      spaceElements: {
        select: {
          id: true,
          element: {
            select: {
              id: true,
              imageUrl: true,
              width: true,
              height: true,
            },
          },
          x: true,
          y: true,
        },
      },
    },
  });
  if (!space) {
    res.status(404).json({ message: "Space not found" });
    return;
  }
  res.json({
    dimensions: `${space.width}x${space.height}`,
    elements: space.spaceElements.map((spaceElem) => {
      return {
        id: spaceElem.id,
        element: {
          id: spaceElem.element.id,
          imageUrl: spaceElem.element.imageUrl,
          width: spaceElem.element.width,
          height: spaceElem.element.height,
        },
        x: spaceElem.x,
        y: spaceElem.y,
      };
    }),
  });
});

spaceRouter.delete("/element", userMiddleware, async (req, res) => {
  const parsedData = DeleteElementSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: "Validation failed" });
    return;
  }
  const spaceElement = await client.spaceElements.findFirst({
    where: { id: parsedData.data.id },
    include: { space: true },
  });
  if (!spaceElement) {
    res.status(404).json({ message: "Element not found" });
    return;
  }
  if (
    !spaceElement.space.creatorId ||
    spaceElement.space.creatorId !== req.userId
  ) {
    res.status(403).json({ message: "Unauthorized" });
    return;
  }
  await client.spaceElements.delete({ where: { id: parsedData.data.id } });
  res.json({ message: "Element deleted" });
});
