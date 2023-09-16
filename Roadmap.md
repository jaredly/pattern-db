
# Classification Systems

ok folks so some people have scienced about this already

https://dl.acm.org/doi/abs/10.5555/985821.985835
https://sci-hub.hkvisa.net/10.1109/viz.2009.46
https://www.researchgate.net/publication/359472668_Classification_of_Islamic_Geometric_Patterns_based_on_Machine_Learning_Techniques
https://www.sciencedirect.com/science/article/pii/S2095263513000216
https://sci-hub.hkvisa.net/https://doi.org/10.1007/978-94-017-1689-5_13

it'd be cool if I could email Ahmad M. Aljamali and see if he can send me the computer program he made for grid-level production of IGPs

egh, so I wonder if I care... that these patterns be constructable a/ just ruler & compass. Does that end up being weird?


alsoooo it'd be cool if I could construct the classification in such a way
that it didn't really matter which "center of symmetry" I started from...


> Maybe for best value, I want a couple of classification systems? (all unambiguous in their own right I hopeeee)

Like, there's the "minimum mirrorable whatsit"

One mirror method is:
reflect on 3 sides of a right triangle (is this only hex?) - 30/60/90 tri for a hex I believe

One is:
reflect on two sides, rotate on the hypotenuse
(seeing this a couple of times.)

A 4x way is reflect on all 3 sides of a 45/45/90 triangle

anyway

ooooh how about one thing is
"How many shapes are in the fundamental triangle?"
**YES** Do this, please. That is a very interesting number.

ALSO I can go through the fundamental triangle to determine, like,
the shapes involved, right?
"There are these 6 shapes"
- two oct stars
- two house pentagons
- 2 oct bow-ties
3 unique shapes

QUestion, does the coloring (chromatic number) of the fund triangle
in itself give me the one for the whole pattern? That'd be nice.
idkd seems like it might


12 shapes, 5 unique
- 10pt star (skip 2 points) x 2 (.15, .1)
- kite x 3 (1 x 2,0.5)
- hex irreg x 5 (1, 0.5 x 4)
- 5pt star (skip 1 pt) x 1 (1)
- rect w/ 2 divots x 1 (0.5)

7 shapes, 7 unique
- 6pt star (skip 1) x1 (1/12)
- reg hex x 1 (0.5)
- irreg oct x 1 (0.5)
- kite x 1 (0.5)
- kite x 1 (0.5)
- irreg hex x 1 (0.5)
- hex x 1 (1/6)

SUPERSHAPES overlapping dodecahedrons

6 shapes, 5 unique
- 12 pt star (skip 3) (1/6)
- kite (1)
- hex (0.5 x 2)
- squash 5pt star (skip 1) (0.5)
- hex (1/6)


Ok so for patterns that don't have mirroring,
we will need a parallelorgram.
Andd I think that paralellogram should be
uniquely producible?

HMMM IS IT the case
that "superstructure" lines will reach across ... the triangle?
heh might be hard to predict actually

Ok, so thinking about applying this to the geometric-art app
do I want to be in the business of ... just constructing the
fundamental triangle?
could be interesting.

OK NEW DECISION: don't count one half and another half separately, just report the combined (merged) count of shapes.


HRMMM SO
I might want a way to indicate
those patterns that would be just radial, that have been squished into tiling.
--- hrm, maybe I could just identify subset triangles? yeah


>

It would be nice to...
be able to filter on "this has a star" or "patterns that have no stars"

list of shapes
shapes have ~attributes
(clockwise angles, starting with the angle pointing toward the center)

star/kite/reg/dart/double-dart/double-kite

exact (list of angles)
  (and, list of congruent sides?)
  (maybe, like, relative sizes of sides)
  (eh, it's "more exact", right?)
  (OH I could have "ratios of each successive side to the first side" yeah that'll work)
  -> FLIP
  -> OK so actually, hm

So
having an actually unique & comparable representation
it'll be the triangle
with the hypotenuse having a positive slope, and bottom side
going straight to the right

generall
  idk I can like make some functions, that can detect common shapes!

can I just pretend that it's a bag of shapes?

SHAPE:
- sides?
- [convex | star | other]
- regular? y/n


# Next up:

- Geometric Art updates to be able to export the fundamental whatsit
  - [ ] flip (V/H) & rotate (45/90)


# Nomenclature

Names of kinds of things
So there's "Girih tiles"

- star (regular, irregular) (obtuse, acute, right)
- kite
- 6-sided kite
- square
- 6-sided dart
- "truncated"
- "snub"?
- concave / convex

- 2-concave (2 concavities)
- 1-concave

- pentagon, 3-indents?

- "vase" is a hexagon with 4 concavities
- pentagon w/ 2 concavities

## Nother idea

Can I, like, classify things by
- # sides
- convexity pattern (all, alternating, something else)
- idk I kinda still want a way for a 5-pointed star to be more like a pentagon than a decagon
idk maybe it's fine.

trying this out

12/alt/reg [1] | 6/all/reg [6] (6)
16/alt/reg [1] | 6/all [8] | 8/etc [1] + 5/all [2] [4] | 8/all/reg [4] (4)

WHATIF
I have the capacity
for like nesting symmetries
which makes some sense right

all = all convex
alt = star
alt2 = 2 convex then a concave
alt3 = 3 convext then a concave
etc = something else


Another way of the above
8/all/reg [1]
> 16/alt/reg[1] | 6/all [8]
(16/all/reg
> circle [1] | 5/all [8]
+ 8/etc) [4]

8/all/reg [1]
> reg oct star
  > with . 8/etc [4] inside
  4/all [8]
  4/all [8]
5/all [8]
> 10/alt [1] | 4/all [5]

^^ so that one is pretty cool

So, having the idea of interlaced tiling?
Also multiple overlayed tilings

12/all/reg [1]
> 12/alt/reg | (8/etc + 6/all) [6]
-- interlaced

12/alt/reg | (4/all + 4/all) [6] | 4/all[6]
-- interlaced


12/alt/reg | (4/all/reg + 12/alt3/reg) [6] | (4/all/reg + 12/alt/reg) [6] |



What about "map coloring" e.g. the four color theorem.
Many (most?) of islamic geometric art has a chromatic number of 2
but some have more.

HRM so like
trying to categorize based on "rings" is a little funky
and arbitrary althoooo I can just do "who has the closest point to the center
yeah

basically I reeeally want a way to classify that is automatic.





# Other DBs

So there's this https://tilingsearch.mit.edu/ - which is older
And also this https://patterninislamicart.com/ - which is newer

tilingsearch has a symmetry dealio
but
I want better linking
and also, I just want to like download or scrape or something.





# Up next

- [x] add / rm tags


# So, I'm making a db of patterns

I drop an image
it creates a new Pattern
Patterns can be merged
a Pattern can have multiple images
multiple tags
multiple links
You can set the tags & links of the current filter
and those are applied to new drops
