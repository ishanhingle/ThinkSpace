import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { jwt, sign } from 'hono/jwt'
const userRouter = new Hono<{
	Bindings: {
		DATABASE_URL: string
	}
}>()

userRouter.post('/signup', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate())

	const body = await c.req.json();
	try {
		const user = await prisma.user.create({
			data: {
				name: body.name,
				email: body.email,
				password: body.password
			}
		})
		const token = await sign({ userId: user.id }, "somesecret");
		return c.json({ token });
	}
	catch(e){
		c.status(403);
		c.json({
			error:"error while signing up",
		})
	}
})

userRouter.post('/signin', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate())
	
	const body=await c.req.json();
	const user=await prisma.user.findUnique({
		where:{
			email:body.email,
			password:body.password
		}
	})
	if(!user){
		c.status(403);
		return c.json({error:"user not found or incorrect password"});
	}
	const token=await sign({userId:user.id},"somesecret");
	return c.json({token});

})
export default userRouter