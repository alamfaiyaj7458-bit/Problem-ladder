-- Sample content so the app has something to show immediately.
-- Safe to run once after 0001_init.sql. Re-running will create duplicate
-- units (slugs are unique, so a second run will fail loudly rather than
-- silently duplicate — that's intentional).

insert into units (name, slug, description, sort_order) values
  ('Geometry', 'geometry', 'Shapes, circles, triangles, and coordinate methods.', 1),
  ('Algebra', 'algebra', 'Equations, polynomials, and functions.', 2),
  ('Number Theory', 'number-theory', 'Divisibility, primes, and modular arithmetic.', 3),
  ('Combinatorics', 'combinatorics', 'Counting, graphs, and the pigeonhole principle.', 4);

insert into chapters (unit_id, name, slug, description, sort_order)
select id, 'Circles', 'circles', 'Tangents, chords, and the power of a point.', 1 from units where slug = 'geometry'
union all
select id, 'Triangles', 'triangles', 'Congruence, similarity, and triangle centers.', 2 from units where slug = 'geometry'
union all
select id, 'Polygons', 'polygons', 'Angles, area, and regular polygons.', 3 from units where slug = 'geometry'
union all
select id, 'Coordinate Geometry', 'coordinate-geometry', 'Lines, distances, and loci in the plane.', 4 from units where slug = 'geometry'
union all
select id, 'Linear Equations', 'linear-equations', 'Single and simultaneous linear equations.', 1 from units where slug = 'algebra'
union all
select id, 'Quadratic Equations', 'quadratic-equations', 'Roots, discriminants, and Vieta''s formulas.', 2 from units where slug = 'algebra'
union all
select id, 'Polynomials', 'polynomials', 'Factoring, roots, and polynomial identities.', 3 from units where slug = 'algebra'
union all
select id, 'Functions', 'functions', 'Functional equations and transformations.', 4 from units where slug = 'algebra'
union all
select id, 'Divisibility', 'divisibility', 'GCD, LCM, and divisibility rules.', 1 from units where slug = 'number-theory'
union all
select id, 'Primes', 'primes', 'Prime factorization and properties of primes.', 2 from units where slug = 'number-theory'
union all
select id, 'Modular Arithmetic', 'modular-arithmetic', 'Congruences and modular reasoning.', 3 from units where slug = 'number-theory'
union all
select id, 'Counting', 'counting', 'Permutations, combinations, and counting arguments.', 1 from units where slug = 'combinatorics'
union all
select id, 'Graph Theory', 'graph-theory', 'Graphs, paths, and basic graph arguments.', 2 from units where slug = 'combinatorics'
union all
select id, 'Pigeonhole Principle', 'pigeonhole-principle', 'Existence arguments via pigeonhole.', 3 from units where slug = 'combinatorics';

-- A handful of published problems, spanning the difficulty scale.
insert into problems (chapter_id, title, statement, difficulty_score, tags, status, source, published_at)
select
  c.id,
  'Circle Through Centre and Radius',
  'Find the equation of a circle with centre (2, 5) and radius 5 units.',
  8,
  array['circle', 'equation', 'radius'],
  'published',
  'manual',
  now()
from chapters c join units u on u.id = c.unit_id
where u.slug = 'geometry' and c.slug = 'circles'

union all

select
  c.id,
  'Tangent Length from an External Point',
  'A point P lies 13 units from the centre of a circle of radius 5. Find the length of the tangent from P to the circle.',
  28,
  array['circle', 'tangent', 'power of a point'],
  'published',
  'manual',
  now()
from chapters c join units u on u.id = c.unit_id
where u.slug = 'geometry' and c.slug = 'circles'

union all

select
  c.id,
  'Cyclic Quadrilateral Angle Chase',
  'ABCD is a cyclic quadrilateral with angle A = 75 degrees. Find angle C, and explain why opposite angles in a cyclic quadrilateral are supplementary.',
  45,
  array['cyclic quadrilateral', 'circle', 'angle chase'],
  'published',
  'manual',
  now()
from chapters c join units u on u.id = c.unit_id
where u.slug = 'geometry' and c.slug = 'circles'

union all

select
  c.id,
  'Sum and Product of Roots',
  'If the roots of x^2 - 7x + k = 0 differ by 3, find k using Vieta''s formulas.',
  22,
  array['vieta', 'quadratic', 'roots'],
  'published',
  'manual',
  now()
from chapters c join units u on u.id = c.unit_id
where u.slug = 'algebra' and c.slug = 'quadratic-equations'

union all

select
  c.id,
  'A Classic Pigeonhole Bound',
  'Show that among any 13 people, at least two share a birth month.',
  15,
  array['pigeonhole', 'existence proof'],
  'published',
  'manual',
  now()
from chapters c join units u on u.id = c.unit_id
where u.slug = 'combinatorics' and c.slug = 'pigeonhole-principle'

union all

select
  c.id,
  'Modular Order Hunt',
  'Find the remainder when 7^2024 is divided by 13, and justify your method using properties of modular arithmetic.',
  62,
  array['modular arithmetic', 'remainder', 'powers'],
  'published',
  'manual',
  now()
from chapters c join units u on u.id = c.unit_id
where u.slug = 'number-theory' and c.slug = 'modular-arithmetic';

-- Matching solutions for the seeded problems.
insert into solutions (problem_id, content, source, status)
select id, 'Use (x - h)^2 + (y - k)^2 = r^2 with (h, k) = (2, 5) and r = 5, giving (x - 2)^2 + (y - 5)^2 = 25.', 'manual', 'published'
from problems where title = 'Circle Through Centre and Radius'
union all
select id, 'By the Pythagorean relation for a tangent, tangent length = sqrt(d^2 - r^2) = sqrt(13^2 - 5^2) = sqrt(144) = 12.', 'manual', 'published'
from problems where title = 'Tangent Length from an External Point'
union all
select id, 'Opposite angles of a cyclic quadrilateral are supplementary (they subtend arcs that together make the full circle), so angle C = 180 - 75 = 105 degrees.', 'manual', 'published'
from problems where title = 'Cyclic Quadrilateral Angle Chase'
union all
select id, 'By Vieta, the roots sum to 7 and differ by 3, so they are 5 and 2. Their product k = 5 * 2 = 10.', 'manual', 'published'
from problems where title = 'Sum and Product of Roots'
union all
select id, 'There are only 12 birth months. With 13 people, the pigeonhole principle guarantees at least one month is shared by two or more people.', 'manual', 'published'
from problems where title = 'A Classic Pigeonhole Bound'
union all
select id, 'By Fermat''s little theorem, 7^12 = 1 (mod 13). Since 2024 = 12*168 + 8, 7^2024 = 7^8 (mod 13). Computing stepwise, 7^4 = 9 (mod 13), so 7^8 = 9^2 = 81 = 3 (mod 13), and the remainder is 3.', 'manual', 'published'
from problems where title = 'Modular Order Hunt';
