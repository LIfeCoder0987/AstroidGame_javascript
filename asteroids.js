/* === Variable Declaration === */
const _screen = document.querySelector('.screen');
const sContext = _screen.getContext('2d');

let sWidth;
let sHeight;

// user input
let Keys = {
	ArrowUp:false,
	ArrowRight:false,
	ArrowLeft:false,
	SKey:false
};
const SPACE = ' ';
let HOLD = false;

let ListAsteroids = [];
let ListBullets = [];
let Player = new SpaceObject();
let Dead = false;

let ShipModel = [];
let AsteroidModel = [];

let Score = 0;

let t1,t2;  // time variable for some physics ;)

/* === Main Functions and Logic === */
requestAnimationFrame(start)

function start()
{
	// Some Initialization
	AddEventsListeners();
	_screen.width = 600;
	_screen.height = 600;
	sWidth = _screen.width;
	sHeight = _screen.height;

	ShipModel.push(
		{x:0,    y:-5},
		{x:-2.5, y:2.5},
		{x:2.5,  y:2.5}
	);  // A simple Isoceles Triangle

	let verts = 20;
	for (let i = 0; i < verts; i++)
	{
		let radius = Math.random() * 0.4 + 0.8;
		let a = (i / verts) * 2*Math.PI;
		AsteroidModel.push(
			{x: radius * Math.sin(a), y: radius * Math.cos(a)}
		);
	}

	InitResetGame();

	t1 = new Date().getTime();
	mainLoop();
}

function mainLoop()
{
	t2 = new Date().getTime();
	let elapsedTime = t2 - t1;
	elapsedTime /= 100;
	t1 = t2;

	ClearFunc();
	UpdateFunc(elapsedTime);
	DrawFunc();
	requestAnimationFrame(mainLoop);
}

function ClearFunc()
{
	sContext.clearRect( 0,0, sWidth,sHeight );
}

function UpdateFunc(elapsedTime)
{
	if (Dead)
		InitResetGame();

	// Steer - left and right
	if (Keys.ArrowRight)
		Player.angle += 0.5 * elapsedTime;
	if (Keys.ArrowLeft)
		Player.angle -= 0.5 * elapsedTime;

	// Thrust =========
	if (Keys.ArrowUp)
	{
		// ACCELERATION changes VELOCITY (with respect to time)
		Player.dx += Math.sin(Player.angle) * elapsedTime;
		Player.dy += -Math.cos(Player.angle) * elapsedTime;
	}

	// Shot Bullets ========
	if (Keys.SKey && !HOLD)
	{
		ListBullets.push(new SpaceObject(
			Player.x,Player.y,
			50 * Math.sin(Player.angle), -50 * Math.cos(Player.angle), 0,0
		));
		HOLD = true;
	}

	// VELOCITY changes POSITION (with respect to time)
	Player.x += Player.dx * elapsedTime;
	Player.y += Player.dy * elapsedTime;

	// Keep the Player in Game Space
	[Player.x, Player.y] = WrapCoordinates(Player.x, Player.y);

	// Updating the Asteroids
	for (let asteroid of ListAsteroids)
	{
		asteroid.x += asteroid.dx * elapsedTime;
		asteroid.y += asteroid.dy * elapsedTime;

		// Keep the asteroid in game space
		[asteroid.x, asteroid.y] = WrapCoordinates(asteroid.x, asteroid.y);
	}

	// Updating Bullets
	for (let bullet of ListBullets)
	{
		bullet.x += bullet.dx * elapsedTime;
		bullet.y += bullet.dy * elapsedTime;

		for (let asteroid of ListAsteroids)
		{
			if (IsPointInsideCircle(asteroid.x, asteroid.y, bullet.x, bullet.y, asteroid.size))
			{
				// Kill the bullet
				bullet.x = -100;   // Force it out the screen

				// augmenting the score
				Score += 100;

				if (asteroid.size > 20)
				{
					// We Create two child asteroids
					let angle1 = Math.random() * 2*Math.PI;
					let angle2 = Math.random() * 2*Math.PI;

					// Pushing two child asteroids to the asteroids list
					ListAsteroids.push(
						new SpaceObject(
							asteroid.x,asteroid.y,
							10 * Math.sin(angle1), 10 * Math.cos(angle1),
							asteroid.size >> 1, 0
						),
						new SpaceObject(
							asteroid.x,asteroid.y,
							10 * Math.sin(angle2), 10 * Math.cos(angle2),
							asteroid.size >> 1, 0
						)
					);
				}
				// Kill the asteroid
				asteroid.x = -100;
			}
		}
	}

	// Checking Ship Collision with Asteroids
	for (let asteroid of ListAsteroids)
		if (IsPointInsideCircle(asteroid.x, asteroid.y, Player.x, Player.y, asteroid.size))
			Dead = true;

	// Removing bullets out of the screen
	if (ListBullets.length !== 0)
		ListBullets = ListBullets.filter(function(bullet)
		{
			// if the bullet is not out the screen
			// we just keep it
			return !(bullet.x < 1 || bullet.y < 1 || bullet.x >= sWidth || bullet.y >= sHeight);
		});

	// Removing Asteroids that been hitted
	if (ListAsteroids.length !== 0)
		ListAsteroids = ListAsteroids.filter(function(asteroid)
		{
			return !(asteroid.x < -1);
		});

	// After Killing all the Asteroids
	if (ListAsteroids.length === 0)
	{
		Score += 1000; // give a big score

		ListAsteroids = []; // we clean
		ListBullets = [];	// the screen

		// We add Two another Asteroids that are not on top of the player
		ListAsteroids.push(
			new SpaceObject(
				10 * Math.sin(Player.angle - Math.PI / 2),
				10 * Math.cos(Player.angle - Math.PI / 2),
				10 * Math.sin(Player.angle),
				10 * Math.cos(Player.angle),
				80, 0
			),
			new SpaceObject(
				10 * Math.sin(Player.angle + Math.PI / 2),
				10 * Math.cos(Player.angle + Math.PI / 2),
				10 * Math.sin(-Player.angle),
				10 * Math.cos(-Player.angle),
				80, 0
			)
		);
	}
}

function DrawFunc()
{
	// Draw The Ship
	DrawWireFrameModel(ShipModel, Player.x,Player.y, Player.angle, Player.size);

	// Draw Asteroids
	for (let asteroid of ListAsteroids)
		DrawWireFrameModel(AsteroidModel, asteroid.x, asteroid.y, asteroid.angle, asteroid.size);

	// Draw Bullets
	for (let bullet of ListBullets)
		DrawRect(bullet.x,bullet.y);

	// Draw Score
	DrawString(20,50, "SCORE: "+Score, "white", "40px Arial");
}

/* === Helper Functions === */
function SpaceObject(x,y, dx,dy, size, angle)
{
	this.x = x;
	this.y = y;
	this.dx = dx;
	this.dy = dy;
	this.size = size;
	this.angle = angle;
}

function WrapCoordinates(x,y)
{
	let _x = x, _y = y;
	if (x < 0) 			_x = x + sWidth;
	if (x >= sWidth) 	_x = x - sWidth;
	if (y < 0)			_y = y + sHeight;
	if (y >= sHeight)	_y = y - sHeight;
	return [_x, _y];
}

function IsPointInsideCircle(cx,cy, x,y, radius)
{
	// cx,cy: circle x and y position
	// x,y  : the point position
	// pythagorean theorem
	return Math.sqrt((cx - x)*(cx - x) + (cy - y)*(cy - y)) < radius;
}

function DrawWireFrameModel(Coords, x,y, r=0,s=1, color="white")
{ // Our Model will be a bounch of lines - r: rotation | s: scale

	let verts = Coords.length;
	let TransformedCoords = new Array(verts);
	for (let i = 0; i < verts; i++) TransformedCoords[i] = {};

	// Some basic Transformation that we will apply to our Coordinates

	// Rotation
	for (let i = 0; i < verts; i++)
	{
		TransformedCoords[i].x = Coords[i].x * Math.cos(r) - Coords[i].y * Math.sin(r);
		TransformedCoords[i].y = Coords[i].x * Math.sin(r) + Coords[i].y * Math.cos(r);
	}

	// Scaling
	for (let i = 0; i < verts; i++)
	{
		TransformedCoords[i].x = TransformedCoords[i].x * s;
		TransformedCoords[i].y = TransformedCoords[i].y * s;
	}

	// Translation
	for (let i = 0; i < verts; i++)
	{
		TransformedCoords[i].x = TransformedCoords[i].x + x;
		TransformedCoords[i].y = TransformedCoords[i].y + y;
	}

	// Draw The Polygon - Now the acctual Model Drawing
	for (let i = 0; i < verts; i++)
	{
		let j = (i + 1);
		DrawLine(TransformedCoords[i % verts].x, TransformedCoords[i % verts].y,
				 TransformedCoords[j % verts].x, TransformedCoords[j % verts].y,
				 color);
	}
}

function DrawLine(x1,y1, x2,y2, color)
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
	sContext.fillRect( x,y, 2,2 );
}

function DrawString(x,y, string,color,font)
{
	sContext.font = font;
	sContext.fillStyle = color;
	sContext.textAlign = "left";
	let text = string;
	sContext.fillText(text, x,y);
}

function InitResetGame()
{
	// Clear the game from asteroids and bullets
	ListAsteroids = [];
	ListBullets = [];

	// Push two astroids for starting
	ListAsteroids.push(new SpaceObject(20,  20,  8,-6, 80, 0));
	ListAsteroids.push(new SpaceObject(100, 20, -5, 3, 80, 0));

	// initialize/Reset Player Positions
	Player.x = sWidth/2;
	Player.y = sHeight/2;
	Player.dx = 0;
	Player.dy = 0;
	Player.angle = 0;
	Player.size = 5;

	Dead = false; // Back to life
	Score = 0;    // Start from the beginning
}

function AddEventsListeners()
{
	document.addEventListener("keydown", function(e)
	{
		Keys[e.key] = true;
		if (e.key === SPACE)
			Keys.SKey = true;
	});
	document.addEventListener("keyup", function(e)
	{
		Keys[e.key] = false;
		if (e.key === SPACE)
		{
			Keys.SKey = false;
			HOLD = false;
		}
	});
}