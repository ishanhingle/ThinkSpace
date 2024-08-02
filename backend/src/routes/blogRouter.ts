import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { verify } from "hono/jwt";
const blogRouter = new Hono<{
	Bindings: {
		DATABASE_URL: string;
	},
	Variables: {
		userId: string;
	}
}>()

blogRouter.use('/*', async (c, next) => {
	const header = c.req.header("authorization")?.split(' ')[1] || "";
	console.log(header);
	const user = await verify(header, "somesecret");
	if (user) {
		//@ts-ignore
		const id: string = user.userId || "";
		c.set("userId", id);
		return next();
	}
	else {
		c.status(403);
		return c.json({
			message: "You are not logged in"
		})
	}
})

blogRouter.get('/bulk', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate())
	const blogs = await prisma.post.findMany();
	if (!blogs) {
		c.status(404);
		c.json({
			success: false,
			message: "Blogs not found"
		})
	}
	return c.json({
		blogs,
	})
})

blogRouter.get('/:id', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate())
	const id = c.req.param('id')
	const blog = await prisma.post.findFirst({
		where: {
			id,
		}
	})
	if (!blog) {
		c.status(404);
		c.json({
			success: false,
			message: "Blog not found"
		})
	}
	return c.json({
		blog,
	})
})

blogRouter.post('/', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate())
	const body = await c.req.json();
	const userId=c.get("userId");
	const blog = await prisma.post.create({
		data: {
			title: body.title,
			content: body.content,
			authorId: userId,
		}
	})
	return c.json({
		id: blog.id
	})
})

blogRouter.put('/', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate())
	const body = await c.req.json();
	const blog = await prisma.post.update({
		where: {
			id: body.id,
		},
		data: {
			title: body.title,
			content: body.content,
		}
	})
	return c.json({
		id: blog.id
	})
})
export default blogRouter;