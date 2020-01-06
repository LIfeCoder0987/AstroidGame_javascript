					/* ==== Variable Diclaration ==== */
const _screen = document.querySelector('.screen');
_screen.width = 600;
_screen.height = 600;
const sContext = _screen.getContext('2d');

const sWidth = _screen.width;
const sHeight = _screen.height;


let Keys = {
	ArrowRight: false,
	ArrowLeft: false,
	ArrowUp: false,
	ArrowDown: false
};

let SPACE = false;
let HOLD = false;

let t1,t2;

function SpaceObject(x,y,dx,dy,size,angle)  // Constructor function to instantiate
{									  		// new space objects
	this.x = x;
	this.y = y;
	this.dx = dx;
	this.dy = dy;
	this.size = size;
	this.angle = angle;
}

let ListAstroids = [];
let ListBullets = [];
let player = new SpaceObject();
let Dead = false;

let ShipModel = [];
let AstroidModel = [];

let Score = 0;

			/* ==== Main Functions and Implemantation ==== */
requestAnimationFrame(start);

function start()
{
	// Some Inialization;
	// ...

	AddEventListeners();

	ShipModel.push(
		{x:0,    y:-5},
		{x:-2.5, y:2.5},
		{x:2.5,  y:2.5}
	); // A simple Isoceles Triangle

	let verts = 20;
	for (let i=0; i < verts; i++)
	{
		let radius = Math.random() * 0.4 + 0.8;
		let a = (i / verts) * 2*Math.PI;
		AstroidModel.push({x: radius*Math.sin(a), y: radius*Math.cos(a)});
	}

	ResetGame();

	t1 = new Date().getTime();
	mainLoop();
}

function mainLoop()
{
	t2 = new Date().getTime();
	let elapsedTime = t2 - t1;
	elapsedTime /= 100;
	t1 = t2;
	clearFunc();
	updateFunc(elapsedTime);
	drawFunc();
	requestAnimationFrame(mainLoop);
}

function clearFunc()
{
	// Clear all the screen
	sContext.clearRect( 0,0, sWidth,sHeight );
}

function updateFunc(elapsedTime)
{
	// Main Logic
	// ...

	if (Dead)
		ResetGame();

	// Steer
	if (Keys.ArrowRight)
		player.angle += 0.5 * elapsedTime;
	if (Keys.ArrowLeft)
		player.angle -= 0.5 * elapsedTime;

	if (SPACE && !HOLD)
	{
		ListBullets.push(new SpaceObject(
			player.x,player.y,
			50 * Math.sin(player.angle), -50 * Math.cos(player.angle), 0,0
		));
		HOLD = true;
	}

	// Thrust
	if (Keys.ArrowUp)
	{
		// ACCELERATION changes VELOCITY (with respect to time)
		player.dx += Math.sin(player.angle) * elapsedTime;
		player.dy += -Math.cos(player.angle) * elapsedTime;
	}

	// VELOCITY changes POSITION (with respect to time)
	player.x += player.dx * elapsedTime;
	player.y += player.dy * elapsedTime;

	// Keep shep in gamespace
	[player.x, player.y] = WrapCoordinates(player.x, player.y);

	// Updating the astoirds
	for (let astroid of ListAstroids)
	{
		astroid.x += astroid.dx * elapsedTime;
		astroid.y += astroid.dy * elapsedTime;
		astroid.angle += 0.1 * elapsedTime;
		[astroid.x, astroid.y] = WrapCoordinates(astroid.x, astroid.y);
	}

	// Updating the bullets
	for (let bullet of ListBullets)
	{
		bullet.x += bullet.dx * elapsedTime;
		bullet.y += bullet.dy * elapsedTime;
//		[bullet.x, bullet.y] = WrapCoordinates(bullet.x, bullet.y);

		// Check bullet astroid Collision
		for (let astroid of ListAstroids)
		{
			if (IsPointInsideCircle(astroid.x,astroid.y, astroid.size, bullet.x,bullet.y))
			{
				// Astriod is hit
				bullet.x = -100;

				if (astroid.size > 20)
				{
					// Create two child astroids
					let angle1 = Math.random() * 2*Math.PI;
					let angle2 = Math.random() * 2*Math.PI;

					// pushing the two astroids to the astroid list
					ListAstroids.push(new SpaceObject(
						astroid.x,astroid.y,
						10 * Math.sin(angle1), 10 * Math.cos(angle1),
						astroid.size >> 1, 0
					), /* <======> */ new SpaceObject(
						astroid.x, astroid.y,
						10 * Math.sin(angle2), 10 * Math.cos(angle2),
						astroid.size >> 1, 0
					));
				}

				astroid.x = -100;
				Score += 100;
			}
		}
	}

	// Checking ship collision with astroids
	for (let astroid of ListAstroids)
		if (IsPointInsideCircle( astroid.x,astroid.y, astroid.size, player.x, player.y ))
			Dead = true;

	// Removing bullets out of the screen
	if (ListBullets.length !== 0)
		ListBullets = ListBullets.filter(function(v)
		{
			return !(v.x < 1 || v.y < 1 || v.x >= sWidth || v.y >= sHeight);
		});

	// Removing astriods that been hit
	if (ListAstroids.length !== 0)
		ListAstroids = ListAstroids.filter(function(v)
		{
			return !(v.x < -1);
		});

	if (ListAstroids.length === 0)
	{
		Score += 1000;
		ListAstroids = [];
		ListBullets = [];

		ListAstroids.push(new SpaceObject(
			10 * Math.sin(player.angle - Math.PI / 2),
			10 * Math.cos(player.angle - Math.PI / 2),
			10 * Math.sin(player.angle),
			10 * Math.cos(player.angle),
			80, 0
		), /* ======== */ new SpaceObject(
			10 * Math.sin(player.angle + Math.PI / 2),
			10 * Math.cos(player.angle + Math.PI / 2),
			10 * Math.sin(-player.angle),
			10 * Math.cos(-player.angle),
			80, 0
		));
	}

	DrawString(20, 50);
}

function drawFunc()
{
	// Drawing routine
	// ....

	// Draw the ship
	DrawWireFrameModel(ShipModel, player.x, player.y, player.angle, player.size);

	// Draw the astroids
	for (let astroid of ListAstroids)
	{
		DrawWireFrameModel(AstroidModel, astroid.x, astroid.y, astroid.angle, astroid.size);
	}

	// Draw Bullet
	for (let bullet of ListBullets)
	{
		DrawRect(bullet.x, bullet.y);
	}
}

				/* ==== Helper Functions and additional behavior ==== */
function AddEventListeners()
{
	document.addEventListener("keydown", function(e)
	{
		// Handling the Arrow Keys
		Keys[e.key] = true

		// Handling the shooting
		if (e.key === " ")
			SPACE = true;
	});
	document.addEventListener("keyup", function(e)
	{
		// Handling Arrow Keys
		Keys[e.key] = false;

		// Handling the shooting
		if (e.key === " ")
		{
			SPACE = false;
			HOLD = false;
		}
	});
}

function IsPointInsideCircle( cx,cy, radius, x,y )
{
	return Math.sqrt((x - cx)*(x - cx) + (y - cy)*(y - cy)) < radius;
}

function DrawWireFrameModel(Coords, x, y, r=0, s=1, color="white")
{
	// Coords[n].x = x coordinate
	// Coords[n].y = y coordinate
	let verts = Coords.length;
	let TransformedCoords = new Array(verts);
	for (let i=0; i < verts; i++) TransformedCoords[i] = {};

	// Rotation
	for (let i=0; i < verts; i++)
	{
		TransformedCoords[i].x = Coords[i].x * Math.cos(r) - Coords[i].y * Math.sin(r);
		TransformedCoords[i].y = Coords[i].x * Math.sin(r) + Coords[i].y * Math.cos(r);
	}

	// Scaling
	for (let i=0; i < verts; i++)
	{
		TransformedCoords[i].x = TransformedCoords[i].x * s;
		TransformedCoords[i].y = TransformedCoords[i].y * s;
	}

	// Translation
	for (let i=0; i < verts; i++)
	{
		TransformedCoords[i].x = TransformedCoords[i].x + x;
		TransformedCoords[i].y = TransformedCoords[i].y + y;
	}

	// Draw The Polygon
	for (let i=0; i < verts; i++)
	{
		let j = (i + 1);
		DrawLine(TransformedCoords[i % verts].x, TransformedCoords[i % verts].y,
				 TransformedCoords[j % verts].x, TransformedCoords[j % verts].y,
				 color);
	}
}

function WrapCoordinates(x,y)
{
	let _x = x, _y = y;
	if (x < 0)			_x = x + sWidth;
	if (x >= sWidth)	_x = x - sWidth;
	if (y < 0)			_y = y + sHeight;
	if (y >= sHeight)	_y = y - sHeight;
	return [_x,_y];
}

function DrawLine( x1,y1, x2,y2, color )
{
	sContext.strokeStyle = color;
	sContext.beginPath();
	sContext.moveTo(x1,y1);
	sContext.lineTo(x2,y2);
	sContext.stroke();
}

function DrawRect(x,y)
{
	sContext.fillStyle = "white";
	sContext.fillRect(x,y,2,2);
}

function DrawString( x,y, string, format )
{
	sContext.font = "30px Orbitron";
	sContext.fillStyle = "white";
	sContext.textAlign = "left";
	let text = "SCORE: " + Score.toString();
	sContext.fillText(text, x,y);
}

function ResetGame()
{
	ListAstroids = [];
	ListBullets = [];

	ListAstroids.push(new SpaceObject(20,  20,  8,-6, 80, 0));
	ListAstroids.push(new SpaceObject(100, 20, -5, 3, 80, 0));

	// Initialise Player Position
	player.x = sWidth / 2;
	player.y = sHeight / 2;
	player.dx = 0;
	player.dy = 0;
	player.angle = 0;
	player.size = 5;

	Dead = false;
	Score = 0;
}
