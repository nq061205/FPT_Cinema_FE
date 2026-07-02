# Backend API Map

Base URL in frontend: `VITE_API_BASE_URL=http://localhost:8080/api`

All protected endpoints require:

```http
Authorization: Bearer <accessToken>
```

## Auth

| Method | Path | Service |
| --- | --- | --- |
| POST | `/auth/login` | `authService.login` |
| GET | `/auth/me` | `authService.me` |
| POST | `/auth/register` | `authService.register` |
| POST | `/auth/logout` | `authService.logout` |

## Movies

| Method | Path | Service |
| --- | --- | --- |
| GET | `/movies/list` | `movieService.list` |
| POST | `/movies/view` | `movieService.search` |
| POST | `/movies/create` | `movieService.create` |

## Showtimes and seats

| Method | Path | Service |
| --- | --- | --- |
| GET | `/showtimes` | `showtimeService.list` |
| GET | `/showtimes/{id}` | `showtimeService.getById` |
| POST | `/showtimes` | `showtimeService.create` |
| POST | `/showtimes/batch` | `showtimeService.createBatch` |
| PUT | `/showtimes/{id}` | `showtimeService.update` |
| DELETE | `/showtimes/{id}` | `showtimeService.cancel` |
| GET | `/showtimes/{id}/seats` | `showtimeService.seatMap` |
| POST | `/showtimes/list` | `showtimeService.listCompact` |
| POST | `/seat/list` | `seatService.viewMap` |
| POST | `/seat/detail` | `seatService.detail` |

## Rooms

| Method | Path | Service |
| --- | --- | --- |
| GET | `/rooms` | `roomService.list` |
| GET | `/rooms/{id}` | `roomService.getById` |
| POST | `/rooms` | `roomService.create` |
| PUT | `/rooms/{id}` | `roomService.update` |
| DELETE | `/rooms/{id}` | `roomService.remove` |
| PUT | `/rooms/{id}/status` | `roomService.updateStatus` |
| GET | `/rooms/{roomId}/seats` | `seatService.getByRoom` |
| POST | `/rooms/{roomId}/seats/generate` | `seatService.generate` |
| PUT | `/rooms/{roomId}/seats/{seatId}` | `seatService.update` |
| PATCH | `/rooms/{roomId}/seats/batch` | `seatService.batchUpdate` |

## Booking, products, promotions

| Method | Path | Service |
| --- | --- | --- |
| POST | `/booking/create` | `bookingService.create` |
| POST | `/booking/list` | `bookingService.history` |
| POST | `/product/list` | `productService.list` |
| POST | `/product/detail` | `productService.detail` |
| POST | `/promotion/detail` | `promotionService.detail` |
| POST | `/promotion/apply` | `promotionService.apply` |
| POST | `/user-promotion/my-promotions` | `promotionService.myPromotions` |

## Users and permissions

| Method | Path | Service |
| --- | --- | --- |
| GET | `/profile` | `profileService.get` |
| PATCH | `/profile/edit` | `profileService.update` |
| PATCH | `/profile/change-password` | `profileService.changePassword` |
| POST | `/user/create` | `userService.create` |
| GET | `/user/user-list` | `userService.list` |
| GET | `/user/{id}` | `userService.getById` |
| PUT | `/user/{id}` | `userService.update` |
| PUT | `/user/{userId}/permissions/{permissionId}` | `userService.assignPermission` |
| PUT | `/user/{userId}/role/{roleId}` | `userService.assignRole` |
| POST | `/permissions` | `permissionService.create` |
| PUT | `/permissions/{id}` | `permissionService.update` |
| PUT | `/roles/{roleId}/permissions/{permissionId}` | `permissionService.assignToRole` |

## Reviews, reports, chat

| Method | Path | Service |
| --- | --- | --- |
| POST | `/reviews` | `reviewService.create` |
| GET | `/reviews/movie/{movieId}` | `reviewService.listByMovie` |
| PUT | `/reviews/{reviewId}` | `reviewService.update` |
| POST | `/reports/booking` | `reportService.booking` |
| POST | `/reports/payment` | `reportService.payment` |
| POST | `/reports/revenue` | `reportService.revenue` |
| POST | `/reports/customer` | `reportService.customer` |
| POST | `/reports/promotion` | `reportService.promotion` |
| POST | `/reports/movie` | `reportService.movie` |
| POST | `/chat/conversations` | `chatService.createConversation` |
| POST | `/chat/conversations/{id}/messages` | `chatService.sendMessage` |
| GET | `/chat/conversations/{id}/messages` | `chatService.messages` |
| PUT | `/chat/conversations/{id}/close` | `chatService.close` |
