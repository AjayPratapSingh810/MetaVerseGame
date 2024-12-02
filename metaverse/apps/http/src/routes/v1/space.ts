import { Router } from "express";
import { CreateElementSchema, CreateSpaceSchema } from "../../types";
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
  const parsedData = CreateElementSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: "Validation failed" });
    return;
  }
  const element = await client.element.create({
    data: {
      imageUrl: parsedData.data.imageUrl,
      width: parsedData.data.width,
      height: parsedData.data.height,
      static: parsedData.data.static,
    },
  });
});

spaceRouter.get("/:spaceId", (req, res) => {});

spaceRouter.delete("/element", (req, res) => {});
